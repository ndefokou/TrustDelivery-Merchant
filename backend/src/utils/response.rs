use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
        }
    }

    #[allow(dead_code)]
    pub fn success_with_message(data: T, message: &str) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: Some(message.to_string()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub success: bool,
    pub error: String,
}

impl ApiError {
    pub fn new(error: &str) -> Self {
        Self {
            success: false,
            error: error.to_string(),
        }
    }
}