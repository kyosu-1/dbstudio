use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DbError {
    pub message: String,
    pub position: Option<usize>,
}

impl From<sqlx::Error> for DbError {
    fn from(e: sqlx::Error) -> Self {
        let message = e.to_string();
        let position = if let sqlx::Error::Database(ref db_err) = e {
            db_err
                .message()
                .find("at character ")
                .and_then(|i| db_err.message()[i + 13..].parse::<usize>().ok())
        } else {
            None
        };
        DbError { message, position }
    }
}

impl std::fmt::Display for DbError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}
