# GitHub Secrets checklist (push = auto deploy to VPS)

Add these secrets once. Then **every push to main** = the workflow **builds** your custom image (with Backup & Restore UI), pushes to GHCR, SSHs to your VPS, and runs Pentaract.

---

## Where to add secrets

**drive** repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add each name below with your value.

---

## 1. VPS login (required)

**Using SSH key (recommended):**


| Secret name         | Value                                                                            |
| ------------------- | -------------------------------------------------------------------------------- |
| **VPS_HOST**        | Your VPS IP or hostname (e.g. `103.187.23.17`)                                   |
| **VPS_USER**        | SSH user (e.g. `root` or `ubuntu`)                                               |
| **SSH_PRIVATE_KEY** | Full private key (include `-----BEGIN ... KEY-----` and `-----END ... KEY-----`) |


**Or** using password:


| Secret name      | Value             |
| ---------------- | ----------------- |
| **VPS_HOST**     | `103.187.23.17`   |
| **VPS_USER**     | `root`            |
| **VPS_PASSWORD** | Your SSH password |


Optional: **VPS_PORT** (default 22), **DEPLOY_PATH** (default `/var/www/drive`), **REPO_URL**.

**VPS requirement:** SSH user needs **passwordless sudo**. For `root` it’s already set. For `ubuntu`, run: `sudo visudo` and add `ubuntu ALL=(ALL) NOPASSWD: ALL`.

---

## 2. Pentaract app (required)


| Secret name           | Example value          | Notes                          |
| --------------------- | ---------------------- | ------------------------------ |
| **SUPERUSER_EMAIL**   | `admin@yourdomain.com` | First admin login email        |
| **SUPERUSER_PASS**    | Strong password        | First admin login password     |
| **SECRET_KEY**        | `openssl rand -hex 32` | Long random string (32+ chars) |
| **DATABASE_PASSWORD** | Strong password        | PostgreSQL password            |


---

## 3. Optional (have defaults)


| Secret name                      | Default                    | Notes                    |
| -------------------------------- | -------------------------- | ------------------------ |
| **PORT**                         | `8000`                     | App port                 |
| **WORKERS**                      | `4`                        | Worker threads           |
| **CHANNEL_CAPACITY**             | `32`                       | Channel capacity         |
| **ACCESS_TOKEN_EXPIRE_IN_SECS**  | `1800`                     | JWT access token expiry  |
| **REFRESH_TOKEN_EXPIRE_IN_DAYS** | `14`                       | JWT refresh token expiry |
| **TELEGRAM_API_BASE_URL**        | `https://api.telegram.org` | Telegram API base URL    |
| **DATABASE_USER**                | `pentaract`                | DB user                  |
| **DATABASE_NAME**                | `pentaract`                | DB name                  |


---

## After you add all secrets

1. Push to `main` (or run the workflow from the **Actions** tab).
2. The workflow will:
  - **Build** Docker image (includes Backup & Restore tab) and push to `ghcr.io/adnanahamed66772ndpc/drive`
  - SSH into your VPS
  - Install Docker and Git if missing
  - Clone (first time) or pull latest
  - Create `.env` from your secrets
  - Run `docker compose -f docker-compose.deploy.yml up -d`
3. When the run is green, open **[http://YOUR_VPS_IP:8000](http://YOUR_VPS_IP:8000)**.
4. **Login:** use **SUPERUSER_EMAIL** and **SUPERUSER_PASS** from secrets.

---

## Troubleshooting

- **Connection timeout** – Allow SSH on the firewall: `sudo ufw allow 22/tcp && sudo ufw reload`. Check cloud security groups if you use AWS/DigitalOcean/etc.
- **SSH handshake failed** – Ensure **SSH_PRIVATE_KEY** includes full key with headers. Use a key without passphrase: `ssh-keygen -t ed25519 -f deploy_key -N ""`.
- **Password login** – If key fails, remove **SSH_PRIVATE_KEY** and set **VPS_PASSWORD**.
- **GHCR pull denied** – If the image is private, go to repo → Packages → drive → Package settings → Change visibility to **Public**.

