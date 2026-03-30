use crate::config::storage::SshConfig;
use async_trait::async_trait;
use russh::client;
use russh::ChannelMsg;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio_util::sync::CancellationToken;

pub struct SshTunnel {
    local_port: u16,
    cancel: CancellationToken,
    task: tokio::task::JoinHandle<()>,
}

impl SshTunnel {
    pub fn local_port(&self) -> u16 {
        self.local_port
    }

    pub async fn shutdown(self) {
        self.cancel.cancel();
        let _ = self.task.await;
    }
}

struct Handler;

#[async_trait]
impl client::Handler for Handler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &russh_keys::key::PublicKey,
    ) -> Result<bool, Self::Error> {
        Ok(true)
    }
}

pub async fn start(
    ssh_config: &SshConfig,
    remote_host: &str,
    remote_port: u16,
) -> Result<SshTunnel, String> {
    let config = Arc::new(client::Config::default());

    let mut session = client::connect(
        config,
        (ssh_config.host.as_str(), ssh_config.port),
        Handler,
    )
    .await
    .map_err(|e| format!("SSH connection failed: {}", e))?;

    // Authenticate
    let authenticated = match &ssh_config.auth {
        crate::config::storage::SshAuth::Password { password } => session
            .authenticate_password(&ssh_config.username, password)
            .await
            .map_err(|e| format!("SSH auth failed: {}", e))?,
        crate::config::storage::SshAuth::PrivateKey {
            private_key_path,
            passphrase,
        } => {
            let key = russh_keys::load_secret_key(private_key_path, passphrase.as_deref())
                .map_err(|e| format!("Failed to load SSH key: {}", e))?;
            session
                .authenticate_publickey(&ssh_config.username, Arc::new(key))
                .await
                .map_err(|e| format!("SSH key auth failed: {}", e))?
        }
    };

    if !authenticated {
        return Err("SSH authentication failed".to_string());
    }

    let session = Arc::new(session);

    // Bind local listener on ephemeral port
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to bind local port: {}", e))?;
    let local_port = listener
        .local_addr()
        .map_err(|e| format!("Failed to get local addr: {}", e))?
        .port();

    let cancel = CancellationToken::new();
    let cancel_clone = cancel.clone();
    let remote_host = remote_host.to_string();

    let task = tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = cancel_clone.cancelled() => break,
                accept_result = listener.accept() => {
                    match accept_result {
                        Ok((tcp_stream, _)) => {
                            let session = session.clone();
                            let remote_host = remote_host.clone();
                            let cancel = cancel_clone.clone();
                            tokio::spawn(async move {
                                if let Err(e) = forward_connection(
                                    session,
                                    tcp_stream,
                                    &remote_host,
                                    remote_port as u32,
                                    cancel,
                                ).await {
                                    log::error!("SSH tunnel forward error: {}", e);
                                }
                            });
                        }
                        Err(e) => {
                            log::error!("SSH tunnel accept error: {}", e);
                            break;
                        }
                    }
                }
            }
        }
    });

    Ok(SshTunnel {
        local_port,
        cancel,
        task,
    })
}

async fn forward_connection(
    session: Arc<client::Handle<Handler>>,
    tcp_stream: tokio::net::TcpStream,
    remote_host: &str,
    remote_port: u32,
    cancel: CancellationToken,
) -> Result<(), String> {
    let channel = session
        .channel_open_direct_tcpip(remote_host, remote_port, "127.0.0.1", 0)
        .await
        .map_err(|e| format!("Failed to open SSH channel: {}", e))?;

    let (mut tcp_read, mut tcp_write) = tokio::io::split(tcp_stream);

    // TCP -> SSH channel
    let channel_id = channel.id();
    let session_write = session.clone();
    let cancel1 = cancel.clone();
    let tcp_to_ssh = tokio::spawn(async move {
        let mut buf = vec![0u8; 8192];
        loop {
            tokio::select! {
                _ = cancel1.cancelled() => break,
                result = tcp_read.read(&mut buf) => {
                    match result {
                        Ok(0) | Err(_) => break,
                        Ok(n) => {
                            if session_write.data(channel_id, buf[..n].to_vec().into()).await.is_err() {
                                break;
                            }
                        }
                    }
                }
            }
        }
    });

    // SSH channel -> TCP
    let cancel2 = cancel.clone();
    let mut channel = channel;
    let ssh_to_tcp = tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = cancel2.cancelled() => break,
                msg = channel.wait() => {
                    match msg {
                        Some(ChannelMsg::Data { data }) => {
                            if tcp_write.write_all(&data).await.is_err() {
                                break;
                            }
                        }
                        Some(ChannelMsg::Eof) | None => break,
                        _ => {}
                    }
                }
            }
        }
    });

    let _ = tokio::join!(tcp_to_ssh, ssh_to_tcp);
    Ok(())
}
