use sqlx::{postgres::PgRow, PgPool, Row};
use std::fmt::Write;

use crate::errors::{PentaractError, PentaractResult};

const TABLES: &[&str] = &[
    "users",
    "storages",
    "storage_workers",
    "access",
    "files",
    "file_chunks",
    "storage_workers_usages",
];

pub struct BackupService<'d> {
    db: &'d PgPool,
}

impl<'d> BackupService<'d> {
    pub fn new(db: &'d PgPool) -> Self {
        Self { db }
    }

    pub async fn backup(&self) -> PentaractResult<String> {
        let mut sql = String::from("-- Pentaract backup\n\n");

        sql.push_str("TRUNCATE users, storages, storage_workers, access, files, file_chunks, storage_workers_usages RESTART IDENTITY CASCADE;\n\n");

        for table in TABLES {
            self.dump_table(&mut sql, table).await?;
        }

        Ok(sql)
    }

    async fn dump_table(&self, sql: &mut String, table: &str) -> PentaractResult<()> {
        let rows: Vec<PgRow> = sqlx::query(&format!("SELECT * FROM {table}"))
            .fetch_all(self.db)
            .await
            .map_err(|e| {
                tracing::error!("backup error for {}: {}", table, e);
                PentaractError::Unknown
            })?;

        if rows.is_empty() {
            return Ok(());
        }

        let columns: Vec<String> = rows[0]
            .columns()
            .iter()
            .map(|c| c.name().to_string())
            .collect();
        let col_list = columns.join(", ");

        for row in rows {
            let vals: Vec<String> = columns
                .iter()
                .map(|col| format_value(&row, col))
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| {
                    tracing::error!("backup format error: {}", e);
                    PentaractError::Unknown
                })?;
            let val_list = vals.join(", ");
            writeln!(sql, "INSERT INTO {table} ({col_list}) VALUES ({val_list});")
                .map_err(|_| PentaractError::Unknown)?;
        }
        sql.push('\n');

        Ok(())
    }

    pub async fn restore(&self, sql_content: &str) -> PentaractResult<()> {
        let mut tx = self.db.begin().await.map_err(|e| {
            tracing::error!("restore begin: {}", e);
            PentaractError::Unknown
        })?;

        let statements = split_sql_statements(sql_content);

        for stmt in statements {
            let stmt = stmt.trim();
            if stmt.is_empty() || stmt.starts_with("--") {
                continue;
            }
            sqlx::query(stmt)
                .execute(&mut *tx)
                .await
                .map_err(|e| {
                    tracing::error!("restore error: {} | stmt: {}", e, &stmt[..stmt.len().min(100)]);
                    PentaractError::Unknown
                })?;
        }

        tx.commit().await.map_err(|e| {
            tracing::error!("restore commit: {}", e);
            PentaractError::Unknown
        })?;

        Ok(())
    }
}

fn format_value(row: &PgRow, col: &str) -> Result<String, sqlx::Error> {
    if let Ok(Some(v)) = row.try_get::<Option<uuid::Uuid>, _>(col) {
        return Ok(format!("'{}'", v));
    }
    if let Ok(Some(v)) = row.try_get::<Option<i64>, _>(col) {
        return Ok(v.to_string());
    }
    if let Ok(Some(v)) = row.try_get::<Option<i16>, _>(col) {
        return Ok(v.to_string());
    }
    if let Ok(Some(v)) = row.try_get::<Option<bool>, _>(col) {
        return Ok(v.to_string());
    }
    if let Ok(Some(v)) = row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>(col) {
        return Ok(format!("'{}'", v));
    }
    if let Ok(Some(v)) = row.try_get::<Option<String>, _>(col) {
        return Ok(format!("'{}'", escape_sql(v)));
    }
    Ok("NULL".to_string())
}

fn escape_sql(s: String) -> String {
    s.replace('\\', "\\\\").replace('\'', "''")
}

fn split_sql_statements(sql: &str) -> Vec<&str> {
    let mut statements = Vec::new();
    let mut start = 0;
    let mut in_string = false;
    let mut escape = false;
    let mut quote_char = '\0';
    let chars: Vec<char> = sql.chars().collect();

    for (i, &c) in chars.iter().enumerate() {
        if escape {
            escape = false;
            continue;
        }
        if c == '\\' && in_string {
            escape = true;
            continue;
        }
        if in_string {
            if c == quote_char {
                in_string = false;
            }
            continue;
        }
        if c == '\'' || c == '"' {
            in_string = true;
            quote_char = c;
            continue;
        }
        if c == ';' {
            statements.push(sql[start..i].trim());
            start = i + 1;
        }
    }
    if start < sql.len() {
        statements.push(sql[start..].trim());
    }
    statements
}
