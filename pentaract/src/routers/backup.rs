use std::sync::Arc;

use axum::{
    extract::{DefaultBodyLimit, Multipart, State},
    http::{header, HeaderValue, StatusCode},
    middleware,
    response::{AppendHeaders, IntoResponse, Response},
    routing::{get, post},
    Router,
};

use crate::{
    common::routing::{app_state::AppState, middlewares::auth::logged_in_required},
    services::backup::BackupService,
};

pub struct BackupRouter;

impl BackupRouter {
    pub fn get_router(state: Arc<AppState>) -> Router {
        Router::new()
            .route("/download", get(Self::backup))
            .route("/restore", post(Self::restore))
            .layer(DefaultBodyLimit::max(256 * 1024 * 1024))
            .route_layer(middleware::from_fn_with_state(
                state.clone(),
                logged_in_required,
            ))
            .with_state(state)
    }

    async fn backup(
        State(state): State<Arc<AppState>>,
    ) -> Result<Response, (StatusCode, String)> {
        let sql = BackupService::new(&state.db).backup().await.map_err(|e| {
            tracing::error!("backup: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Backup failed".to_owned())
        })?;

        let filename = format!(
            "pentaract_backup_{}.sql",
            chrono::Utc::now().format("%Y%m%d_%H%M%S")
        );
        let content_disp = HeaderValue::from_str(&format!("attachment; filename=\"{}\"", filename))
            .unwrap_or(HeaderValue::from_static("attachment"));

        let headers = AppendHeaders([
            (header::CONTENT_TYPE, HeaderValue::from_static("application/sql")),
            (header::CONTENT_DISPOSITION, content_disp),
        ]);

        Ok((headers, sql).into_response())
    }

    async fn restore(
        State(state): State<Arc<AppState>>,
        mut multipart: Multipart,
    ) -> Result<StatusCode, (StatusCode, String)> {
        let mut sql_content = String::new();

        while let Some(field) = multipart.next_field().await.map_err(|e| {
            tracing::error!("restore multipart: {}", e);
            (StatusCode::BAD_REQUEST, format!("Invalid upload: {}", e))
        })? {
            let name = field.name().unwrap_or("").to_string();
            if name == "file" || name.is_empty() {
                let data = field.bytes().await.map_err(|e| {
                    (StatusCode::BAD_REQUEST, format!("Read error: {}", e))
                })?;
                sql_content = String::from_utf8(data.to_vec()).map_err(|_| {
                    (StatusCode::BAD_REQUEST, "File must be UTF-8 text".to_owned())
                })?;
                break;
            }
        }

        if sql_content.is_empty() {
            return Err((
                StatusCode::BAD_REQUEST,
                "No backup file uploaded. Use field name 'file'.".to_owned(),
            ));
        }

        BackupService::new(&state.db)
            .restore(&sql_content)
            .await
            .map_err(|e| {
                tracing::error!("restore: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Restore failed".to_owned())
            })?;

        Ok(StatusCode::OK)
    }
}
