variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "enable_versioning" {
  description = "Enable versioning for the GCS bucket"
  type        = bool
  default     = true
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "use_cloud_sql" {
  description = "Whether to create a Cloud SQL instance"
  type        = bool
  default     = true
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_availability_type" {
  description = "Cloud SQL availability type"
  type        = string
  default     = "ZONAL"
}

variable "db_disk_size" {
  description = "Cloud SQL disk size in GB"
  type        = number
  default     = 10
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "vpc_network_id" {
  description = "VPC network ID for Cloud SQL"
  type        = string
  default     = null
}

variable "deploy_cloud_run" {
  description = "Whether to deploy Payload on Cloud Run"
  type        = bool
  default     = false
}

variable "payload_image" {
  description = "Docker image for Payload CMS"
  type        = string
  default     = "gcr.io/cloudrun/hello"
}

variable "payload_secret" {
  description = "Payload secret key"
  type        = string
  sensitive   = true
}

variable "database_uri" {
  description = "Database URI (if not using Cloud SQL)"
  type        = string
  default     = ""
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "allow_public_access" {
  description = "Allow public access to Cloud Run service"
  type        = bool
  default     = false
}

variable "enable_cdn" {
  description = "Enable Cloud CDN for assets"
  type        = bool
  default     = false
}
