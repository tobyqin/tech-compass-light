import os

# Set all test environment variables in one place
os.environ["DATABASE_NAME"] = "tc-test"
os.environ["JWT_SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["AUTH_SERVER_ENABLED"] = "false"
os.environ["DEFAULT_ADMIN_USERNAME"] = "admin"
os.environ["DEFAULT_ADMIN_PASSWORD"] = os.environ["DEFAULT_ADMIN_USERNAME"]
os.environ["DEFAULT_ADMIN_EMAIL"] = "admin@techcompass.com"
os.environ["DEFAULT_ADMIN_FULLNAME"] = "System Admin"
