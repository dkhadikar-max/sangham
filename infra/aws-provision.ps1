# =============================================================================
# Sangham - AWS Infrastructure Provisioning Script
# Provisions: RDS PostgreSQL, ElastiCache Redis, S3, CloudFront, IAM
# Region: ap-south-1 (Mumbai) - closest to primary user base (India)
#
# Prerequisites:
#   1. AWS CLI installed: https://aws.amazon.com/cli/
#   2. Configured: aws configure  (enter Access Key, Secret, region ap-south-1)
#   3. Run from C:\Sangham\sangham-backend-src\
# =============================================================================

param(
    [string]$DBPassword = "",
    [string]$Region = "ap-south-1",
    [string]$AppName = "sangham"
)

if ($DBPassword -eq "") {
    $DBPassword = Read-Host "Enter a strong password for the RDS database (min 8 chars, no @/)"
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Sangham - AWS Infrastructure Setup"         -ForegroundColor Cyan
Write-Host "  Region: $Region"                            -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ── Verify AWS CLI is configured ──────────────────────────────────────────────
$awsId = aws sts get-caller-identity --query Account --output text 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS CLI not configured. Run: aws configure" -ForegroundColor Red
    Write-Host "Install CLI: https://aws.amazon.com/cli/" -ForegroundColor White
    exit 1
}
Write-Host "[OK] AWS Account: $awsId" -ForegroundColor Green
Write-Host ""

# ── STEP 1: Get default VPC and subnets ───────────────────────────────────────
Write-Host "[1/7] Getting default VPC..." -ForegroundColor Yellow

$VpcId = aws ec2 describe-vpcs `
    --filters "Name=isDefault,Values=true" `
    --query "Vpcs[0].VpcId" `
    --output text --region $Region

Write-Host "      VPC: $VpcId" -ForegroundColor Green

$SubnetIds = aws ec2 describe-subnets `
    --filters "Name=vpc-id,Values=$VpcId" `
    --query "Subnets[*].SubnetId" `
    --output text --region $Region

$SubnetArray = $SubnetIds -split "\s+"
$SubnetList = $SubnetArray[0] + "," + $SubnetArray[1]
Write-Host "      Subnets: $SubnetList" -ForegroundColor Green

# ── STEP 2: Security Groups ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/7] Creating security groups..." -ForegroundColor Yellow

$RdsSgId = aws ec2 create-security-group `
    --group-name "$AppName-rds-sg" `
    --description "Sangham RDS PostgreSQL" `
    --vpc-id $VpcId `
    --query "GroupId" --output text --region $Region

aws ec2 authorize-security-group-ingress `
    --group-id $RdsSgId `
    --protocol tcp --port 5432 `
    --cidr 0.0.0.0/0 `
    --region $Region | Out-Null

Write-Host "      RDS security group: $RdsSgId" -ForegroundColor Green

$RedisSgId = aws ec2 create-security-group `
    --group-name "$AppName-redis-sg" `
    --description "Sangham ElastiCache Redis" `
    --vpc-id $VpcId `
    --query "GroupId" --output text --region $Region

aws ec2 authorize-security-group-ingress `
    --group-id $RedisSgId `
    --protocol tcp --port 6379 `
    --cidr 0.0.0.0/0 `
    --region $Region | Out-Null

Write-Host "      Redis security group: $RedisSgId" -ForegroundColor Green

# ── STEP 3: RDS PostgreSQL ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/7] Creating RDS PostgreSQL (db.t3.micro, free tier eligible)..." -ForegroundColor Yellow
Write-Host "      This takes 5-8 minutes. Please wait..." -ForegroundColor Gray

# Create DB subnet group first
aws rds create-db-subnet-group `
    --db-subnet-group-name "$AppName-subnet-group" `
    --db-subnet-group-description "Sangham DB subnet group" `
    --subnet-ids $SubnetArray[0] $SubnetArray[1] `
    --region $Region | Out-Null

aws rds create-db-instance `
    --db-instance-identifier "$AppName-db" `
    --db-instance-class db.t3.micro `
    --engine postgres `
    --engine-version "15.4" `
    --master-username sangham `
    --master-user-password $DBPassword `
    --db-name sangham_db `
    --allocated-storage 20 `
    --storage-type gp2 `
    --db-subnet-group-name "$AppName-subnet-group" `
    --vpc-security-group-ids $RdsSgId `
    --publicly-accessible `
    --backup-retention-period 7 `
    --no-multi-az `
    --region $Region | Out-Null

Write-Host "      RDS instance creating (async)..." -ForegroundColor Green
Write-Host "      Waiting for endpoint to be available..." -ForegroundColor Gray

# Poll until available
$RdsEndpoint = ""
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 20
    $RdsEndpoint = aws rds describe-db-instances `
        --db-instance-identifier "$AppName-db" `
        --query "DBInstances[0].Endpoint.Address" `
        --output text --region $Region 2>$null
    if ($RdsEndpoint -ne "None" -and $RdsEndpoint -ne "") {
        break
    }
    Write-Host "      Still waiting... ($([int]($i+1)*20)s)" -ForegroundColor Gray
}

Write-Host "      RDS endpoint: $RdsEndpoint" -ForegroundColor Green

# ── STEP 4: ElastiCache Redis ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/7] Creating ElastiCache Redis (cache.t3.micro)..." -ForegroundColor Yellow

aws elasticache create-cache-subnet-group `
    --cache-subnet-group-name "$AppName-redis-subnet" `
    --cache-subnet-group-description "Sangham Redis subnet" `
    --subnet-ids $SubnetArray[0] $SubnetArray[1] `
    --region $Region | Out-Null

aws elasticache create-cache-cluster `
    --cache-cluster-id "$AppName-redis" `
    --cache-node-type cache.t3.micro `
    --engine redis `
    --engine-version "7.1" `
    --num-cache-nodes 1 `
    --cache-subnet-group-name "$AppName-redis-subnet" `
    --security-group-ids $RedisSgId `
    --region $Region | Out-Null

Write-Host "      Redis cluster creating (async)..." -ForegroundColor Green

$RedisEndpoint = ""
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 15
    $RedisEndpoint = aws elasticache describe-cache-clusters `
        --cache-cluster-id "$AppName-redis" `
        --show-cache-node-info `
        --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" `
        --output text --region $Region 2>$null
    if ($RedisEndpoint -ne "None" -and $RedisEndpoint -ne "") {
        break
    }
    Write-Host "      Still waiting... ($([int]($i+1)*15)s)" -ForegroundColor Gray
}
Write-Host "      Redis endpoint: $RedisEndpoint" -ForegroundColor Green

# ── STEP 5: S3 Bucket ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/7] Creating S3 bucket for media..." -ForegroundColor Yellow

$BucketName = "$AppName-media-$awsId"

aws s3api create-bucket `
    --bucket $BucketName `
    --region $Region `
    --create-bucket-configuration LocationConstraint=$Region | Out-Null

# Block all public access (serve via CloudFront only)
aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration `
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" `
    --region $Region | Out-Null

# Apply CORS policy for browser uploads
aws s3api put-bucket-cors `
    --bucket $BucketName `
    --cors-configuration file://infra/s3-cors.json `
    --region $Region | Out-Null

Write-Host "      S3 bucket: $BucketName" -ForegroundColor Green

# ── STEP 6: CloudFront Distribution ──────────────────────────────────────────
Write-Host ""
Write-Host "[6/7] Creating CloudFront distribution..." -ForegroundColor Yellow

$CfConfig = @"
{
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-$BucketName",
      "DomainName": "$BucketName.s3.$Region.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BucketName",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] }
  },
  "Comment": "Sangham media CDN",
  "Enabled": true,
  "PriceClass": "PriceClass_All",
  "CallerReference": "sangham-$(Get-Date -Format 'yyyyMMddHHmmss')"
}
"@

$CfConfig | Out-File -FilePath "infra/cf-config.json" -Encoding utf8

$CfDomain = aws cloudfront create-distribution `
    --distribution-config file://infra/cf-config.json `
    --query "Distribution.DomainName" `
    --output text 2>$null

Write-Host "      CloudFront domain: $CfDomain" -ForegroundColor Green

# ── STEP 7: IAM User for app ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[7/7] Creating IAM user with S3 + SES permissions..." -ForegroundColor Yellow

aws iam create-user --user-name "$AppName-app" | Out-Null
aws iam put-user-policy `
    --user-name "$AppName-app" `
    --policy-name "$AppName-app-policy" `
    --policy-document file://infra/iam-policy.json | Out-Null

$Keys = aws iam create-access-key `
    --user-name "$AppName-app" `
    --query "AccessKey.[AccessKeyId,SecretAccessKey]" `
    --output text

$KeyParts = $Keys -split "\s+"
$AppKeyId = $KeyParts[0]
$AppKeySecret = $KeyParts[1]

Write-Host "      IAM user: $AppName-app" -ForegroundColor Green

# ── Write final .env ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Writing .env with AWS endpoints..."         -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$envContent = @"
# ── Server ───────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=4000
API_VERSION=v1

# ── AWS RDS PostgreSQL ───────────────────────────────────────────────────────
DATABASE_URL="postgresql://sangham:$DBPassword@${RdsEndpoint}:5432/sangham_db"

# ── AWS ElastiCache Redis ────────────────────────────────────────────────────
REDIS_URL="redis://${RedisEndpoint}:6379"

# ── Auth ─────────────────────────────────────────────────────────────────────
JWT_SECRET=CHANGE-THIS-TO-A-RANDOM-64-CHAR-STRING-BEFORE-DEPLOYMENT
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ── AWS Credentials (app IAM user) ───────────────────────────────────────────
AWS_ACCESS_KEY_ID=$AppKeyId
AWS_SECRET_ACCESS_KEY=$AppKeySecret
AWS_REGION=$Region
AWS_S3_BUCKET=$BucketName
AWS_CLOUDFRONT_DOMAIN=$CfDomain

# ── Agora Live Streaming ──────────────────────────────────────────────────────
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=

# ── Amazon OpenSearch (library search) ───────────────────────────────────────
# Leave blank to fall back to PostgreSQL full-text search (fine for dev/early prod)
ELASTICSEARCH_URL=
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# ── Email via Amazon SES ──────────────────────────────────────────────────────
SMTP_HOST=email-smtp.$Region.amazonaws.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=namo@sangham.app

# ── Twilio OTP ────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# ── Rate Limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# ── CORS ──────────────────────────────────────────────────────────────────────
CLIENT_ORIGIN=http://localhost:3000
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  AWS infrastructure provisioned!"            -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  RDS endpoint   : $RdsEndpoint" -ForegroundColor White
Write-Host "  Redis endpoint : $RedisEndpoint" -ForegroundColor White
Write-Host "  S3 bucket      : $BucketName" -ForegroundColor White
Write-Host "  CloudFront     : $CfDomain" -ForegroundColor White
Write-Host "  IAM Key ID     : $AppKeyId" -ForegroundColor White
Write-Host ""
Write-Host "  .env has been updated with all endpoints." -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "    1. Change JWT_SECRET in .env to a strong random string" -ForegroundColor White
Write-Host "    2. Run: npx prisma migrate dev --name init" -ForegroundColor White
Write-Host "    3. Run: npm run dev" -ForegroundColor White
Write-Host "    4. Visit: http://localhost:4000/health" -ForegroundColor White
Write-Host ""
