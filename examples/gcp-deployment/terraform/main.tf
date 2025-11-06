terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# GCS Bucket for Assets
resource "google_storage_bucket" "payload_assets" {
  name          = "${var.project_id}-payload-assets"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = var.enable_versioning
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  cors {
    origin          = var.cors_origins
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Service Account for Payload
resource "google_service_account" "payload_storage" {
  account_id   = "payload-storage-${var.environment}"
  display_name = "Payload Storage Service Account"
  description  = "Service account for Payload CMS to access GCS"
}

# IAM binding for the service account
resource "google_storage_bucket_iam_member" "payload_storage_admin" {
  bucket = google_storage_bucket.payload_assets.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.payload_storage.email}"
}

# Service Account Key
resource "google_service_account_key" "payload_storage_key" {
  service_account_id = google_service_account.payload_storage.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Cloud SQL PostgreSQL Instance (optional)
resource "google_sql_database_instance" "payload_db" {
  count            = var.use_cloud_sql ? 1 : 0
  name             = "payload-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = var.db_availability_type
    disk_type         = "PD_SSD"
    disk_size         = var.db_disk_size

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled    = true
      private_network = var.vpc_network_id
      require_ssl     = true
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = var.environment == "production" ? true : false
}

# Cloud SQL Database
resource "google_sql_database" "payload" {
  count    = var.use_cloud_sql ? 1 : 0
  name     = "payload"
  instance = google_sql_database_instance.payload_db[0].name
}

# Cloud SQL User
resource "google_sql_user" "payload" {
  count    = var.use_cloud_sql ? 1 : 0
  name     = "payload"
  instance = google_sql_database_instance.payload_db[0].name
  password = var.db_password
}

# Cloud Run Service (for serverless deployment)
resource "google_cloud_run_v2_service" "payload" {
  count    = var.deploy_cloud_run ? 1 : 0
  name     = "payload-cms-${var.environment}"
  location = var.region

  template {
    service_account = google_service_account.payload_storage.email

    containers {
      image = var.payload_image

      env {
        name  = "DATABASE_URI"
        value = var.use_cloud_sql ? "postgresql://${google_sql_user.payload[0].name}:${var.db_password}@/${google_sql_database.payload[0].name}?host=/cloudsql/${google_sql_database_instance.payload_db[0].connection_name}" : var.database_uri
      }

      env {
        name  = "PAYLOAD_SECRET"
        value = var.payload_secret
      }

      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.payload_assets.name
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }

      ports {
        container_port = 3000
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Cloud Run IAM (allow public access)
resource "google_cloud_run_service_iam_member" "public_access" {
  count    = var.deploy_cloud_run && var.allow_public_access ? 1 : 0
  service  = google_cloud_run_v2_service.payload[0].name
  location = google_cloud_run_v2_service.payload[0].location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud CDN (optional)
resource "google_compute_backend_bucket" "cdn" {
  count       = var.enable_cdn ? 1 : 0
  name        = "payload-assets-cdn-${var.environment}"
  bucket_name = google_storage_bucket.payload_assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    client_ttl        = 3600
    default_ttl       = 3600
    max_ttl           = 86400
    negative_caching  = true
    serve_while_stale = 86400
  }
}

# Outputs
output "bucket_name" {
  description = "Name of the GCS bucket"
  value       = google_storage_bucket.payload_assets.name
}

output "bucket_url" {
  description = "URL of the GCS bucket"
  value       = google_storage_bucket.payload_assets.url
}

output "service_account_email" {
  description = "Email of the service account"
  value       = google_service_account.payload_storage.email
}

output "service_account_key" {
  description = "Service account private key (base64 encoded)"
  value       = google_service_account_key.payload_storage_key.private_key
  sensitive   = true
}

output "cloud_run_url" {
  description = "URL of the Cloud Run service"
  value       = var.deploy_cloud_run ? google_cloud_run_v2_service.payload[0].uri : null
}

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = var.use_cloud_sql ? google_sql_database_instance.payload_db[0].connection_name : null
}
