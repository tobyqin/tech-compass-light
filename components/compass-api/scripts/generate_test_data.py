"""
Script to generate test data using the Compass API endpoints.
This script will:
1. Create admin user (admin/admin123) if not exists
2. Create solutions with categories and tags
3. Add comments to solutions
4. Add ratings to solutions
"""

import os
import random
import traceback
from typing import Dict, Optional
from urllib.parse import urlencode

import faker
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
fake = faker.Faker()
user_data = {
    "username": os.getenv("DEFAULT_ADMIN_USERNAME"),
    "email": os.getenv("DEFAULT_ADMIN_EMAIL"),
    "password": os.getenv("DEFAULT_ADMIN_PASSWORD"),
    "full_name": os.getenv("DEFAULT_ADMIN_FULLNAME"),
    "is_active": True,
    "is_superuser": True,
}

# Validate required environment variables
required_env_vars = [
    "DEFAULT_ADMIN_USERNAME",
    "DEFAULT_ADMIN_EMAIL",
    "DEFAULT_ADMIN_PASSWORD",
    "DEFAULT_ADMIN_FULLNAME",
]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")


def debug_request(method: str, url: str, **kwargs):
    """Print request details for debugging."""
    print(f"\n=== {method} {url} ===")
    if "headers" in kwargs:
        print("Headers:", kwargs["headers"])
    if "data" in kwargs:
        print("Form Data:", kwargs["data"])
    if "json" in kwargs:
        print("JSON Data:", kwargs["json"])


class TestDataGenerator:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.solutions = []

    def create_test_user(self) -> Optional[Dict]:
        """Create test user if not exists."""
        try:
            self.login_user(user_data["username"], user_data["password"])
            print("Test user already exists, skipping creation")
            return None
        except requests.exceptions.RequestException:
            # User doesn't exist, create it
            print("Creating test user...")
            url = f"{BASE_URL}/api/users"
            debug_request("POST", url, json=user_data)
            response = self.session.post(url, json=user_data)
            response.raise_for_status()
            return response.json()

    def login_user(self, username: str, password: str) -> str:
        """Login user and return authentication token."""
        # According to OpenAPI spec, login expects form data
        login_data = {
            "username": username,
            "password": password,
            "grant_type": "password",
            "scope": "",
        }

        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        url = f"{BASE_URL}/api/auth/login"
        encoded_data = urlencode(login_data)

        debug_request("POST", url, headers=headers, data=encoded_data)
        response = self.session.post(url, data=encoded_data, headers=headers)

        print("Response status:", response.status_code)
        print("Response headers:", dict(response.headers))
        print("Response body:", response.text)

        response.raise_for_status()
        token = response.json()["access_token"]
        self.token = token
        return token

    def create_solution(self) -> Dict:
        """Create a new solution through the API."""
        stages = ["DEVELOPING", "UAT", "PRODUCTION", "DEPRECATED", "RETIRED"]
        recommend_statuses = ["ADOPT", "TRIAL", "ASSESS", "HOLD"]
        adoption_levels = ["PILOT", "TEAM", "DEPARTMENT", "ENTERPRISE", "INDUSTRY"]
        adoption_complexity_values = ["AUTOMATED", "EASY", "SUPPORT_REQUIRED"]
        provider_types = ["VENDOR", "INTERNAL"]

        # Generate a group name
        groups = [
            "Core Technologies",
            "Integration Tools",
            "Business Applications",
            "Default",
        ]

        # Define technology quadrants and their key areas
        tech_quadrants = {
            "Languages & Frameworks": {
                "areas": [
                    "Programming Languages",
                    "Web Frameworks",
                    "Mobile Frameworks",
                    "Testing Tools",
                    "Build Tools",
                ],
                "quadrant": 0,
            },
            "Platforms & Infrastructure": {
                "areas": [
                    "Cloud Platforms",
                    "Containers",
                    "Databases",
                    "Message Queues",
                    "CI/CD Tools",
                ],
                "quadrant": 1,
            },
            "Data & Analytics": {
                "areas": [
                    "Data Storage",
                    "Data Processing",
                    "Analytics Tools",
                    "Machine Learning",
                    "Visualization",
                ],
                "quadrant": 2,
            },
            "DevOps & Tools": {
                "areas": [
                    "Monitoring",
                    "Logging",
                    "Security",
                    "Performance",
                    "Deployment",
                ],
                "quadrant": 3,
            },
        }

        # Select a random category and its key areas
        category_name = random.choice(list(tech_quadrants.keys()))
        category_info = tech_quadrants[category_name]
        key_areas = category_info["areas"]

        # Create or update category with radar_quadrant
        headers = {"Authorization": f"Bearer {self.token}"}
        category_data = {
            "name": category_name,
            "description": f"Technologies related to {category_name.lower()}",
            "radar_quadrant": category_info["quadrant"],
        }
        url = f"{BASE_URL}/api/categories/"
        try:
            debug_request("POST", url, headers=headers, json=category_data)
            self.session.post(url, json=category_data, headers=headers)
        except requests.exceptions.RequestException:
            # Category might already exist, ignore error
            pass

        # Generate tags from key areas and some common tech terms
        selected_areas = random.sample(key_areas, k=random.randint(1, 3))
        tech_terms = [
            "Cloud Native",
            "DevOps",
            "Automation",
            "Scalability",
            "High Availability",
            "Security",
            "Performance",
            "Open Source",
            "Enterprise",
            "Integration",
            "Monitoring",
            "Analytics",
        ]
        tags = selected_areas + random.sample(tech_terms, k=random.randint(1, 3))

        # Generate a random provider type
        provider_type = random.choice(provider_types)

        # Generate data for the new fields
        solution_name = fake.catch_phrase()

        # Generate upskilling information
        upskilling_templates = [
            f"To learn {solution_name}, consider the following training options:\n- Online courses at {fake.domain_name()}\n- Official certification available at {fake.url()}\n- Internal workshops run quarterly",
            f"No formal certification exists for {solution_name}. Team members typically learn through:\n- Pair programming with experienced users\n- Documentation review\n- Hands-on projects",
            f"Skill development path:\n1. Complete beginner tutorial at {fake.url()}\n2. Take the intermediate course\n3. Apply for advanced certification if needed",
        ]

        # Generate how_to_use instructions
        how_to_use_templates = [
            f"## Getting Started with {solution_name}\n\n1. Install the software from {fake.url()}\n2. Configure your settings\n3. Run the initialization script\n4. Refer to documentation for advanced usage",
            f"### Quick Start Guide\n\n- Register for an account at {fake.url()}\n- Set up your project workspace\n- Import your existing data\n- Follow the guided tutorial for best practices",
            "## Usage Instructions\n\nThis solution can be integrated through:\n- REST API\n- SDK for major languages\n- CLI tools\n\nRefer to examples in the documentation.",
        ]

        # Generate FAQ content
        faq_questions = [
            "How do I reset my password?",
            "Can I use this solution with existing systems?",
            "What are the system requirements?",
            "Is there an API available?",
            "How is data secured?",
            "Can I customize the interface?",
            "What support options are available?",
            "How do I upgrade to the latest version?",
        ]
        faq_content = "## Frequently Asked Questions\n\n"
        for _ in range(random.randint(3, 5)):
            question = random.choice(faq_questions)
            faq_content += f"### {question}\n{fake.paragraph()}\n\n"

        # Generate about content
        about_templates = [
            f"## About {solution_name}\n\nDeveloped by {fake.company()} in {random.randint(2010, 2022)}. This solution has been deployed in over {random.randint(10, 500)} organizations worldwide.\n\nOur mission is to simplify and streamline {category_name.lower()} operations.",
            f"## Background\n\n{solution_name} was created to address common challenges in {category_name}. It has evolved through {random.randint(2, 8)} major versions since its inception.",
            f"## About This Tool\n\nOriginally designed for {fake.bs()}, {solution_name} has grown to support a wide range of use cases in {category_name}.",
        ]

        solution_data = {
            "group": random.choice(groups),
            "name": solution_name,
            "description": fake.text(max_nb_chars=200),
            "brief": fake.text(max_nb_chars=100).split(".")[0] + ".",
            "how_to_use": random.choice(how_to_use_templates),
            "how_to_use_url": fake.url() if random.random() > 0.3 else None,  # 70% chance to have a how-to-use URL
            "faq": faq_content,
            "about": random.choice(about_templates),
            "category": category_name,
            "department": fake.company_suffix(),
            "team": fake.job(),
            "team_email": fake.company_email(),
            "maintainer_id": fake.user_name().lower(),  # Generate lowercase username
            "maintainer_name": fake.name(),
            "maintainer_email": fake.email(),
            "official_website": fake.url(),
            "documentation_url": fake.url(),
            "demo_url": fake.url(),
            "support_url": fake.url(),
            "vendor_product_url": fake.url() if provider_type == "VENDOR" else "",
            "version": f"{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
            "upskilling": random.choice(upskilling_templates),
            "provider_type": provider_type,
            "adoption_level": random.choice(adoption_levels),
            "adoption_complexity": random.choice(adoption_complexity_values),
            "adoption_user_count": random.randint(0, 1000),
            "tags": tags,
            "pros": [fake.sentence() for _ in range(random.randint(2, 4))],
            "cons": [fake.sentence() for _ in range(random.randint(1, 3))],
            "stage": random.choice(stages),
            "recommend_status": random.choice(recommend_statuses),
        }

        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"{BASE_URL}/api/solutions/"
        debug_request("POST", url, headers=headers, json=solution_data)
        response = self.session.post(url, json=solution_data, headers=headers)
        response.raise_for_status()
        return response.json()["data"]

    def create_comment(self, solution_slug: str) -> Dict:
        """Create a new comment on a solution."""
        comment_data = {"content": fake.text(max_nb_chars=200)}

        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"{BASE_URL}/api/comments/solution/{solution_slug}"
        debug_request("POST", url, headers=headers, json=comment_data)
        response = self.session.post(url, json=comment_data, headers=headers)
        response.raise_for_status()
        return response.json()

    def update_solution_review_status(self, solution_slug: str) -> Dict:
        """Update the review status of a solution."""
        review_statuses = ["APPROVED", "REJECTED", "PENDING"]
        # Weight distribution for review status (70% approved, 20% rejected, 10% pending)
        review_weights = [0.7, 0.2, 0.1]
        review_status = random.choices(review_statuses, weights=review_weights)[0]
        update_data = {"review_status": review_status}

        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"{BASE_URL}/api/solutions/{solution_slug}"
        debug_request("PUT", url, headers=headers, json=update_data)
        response = self.session.put(url, json=update_data, headers=headers)
        response.raise_for_status()
        return response.json()

    def create_rating(self, solution_slug: str) -> Dict:
        """Create a new rating for a solution."""
        rating_data = {
            "score": random.randint(1, 5),
            "comment": fake.sentence() if random.random() > 0.5 else None,
        }

        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"{BASE_URL}/api/ratings/solution/{solution_slug}"
        debug_request("POST", url, headers=headers, json=rating_data)
        response = self.session.post(url, json=rating_data, headers=headers)
        response.raise_for_status()
        return response.json()

    def generate_test_data(
        self,
        num_solutions: int = 10,
        num_comments_per_solution: int = 3,
        num_ratings_per_solution: int = 1,
    ):
        """Generate complete test dataset."""
        print("Starting test data generation...")

        # Create/login test user
        self.create_test_user()
        if not self.token:
            self.login_user(user_data["username"], user_data["password"])

        # Create solutions
        print(f"Creating {num_solutions} solutions...")
        for _ in range(num_solutions):
            solution = self.create_solution()
            self.solutions.append(solution)

        # Create comments and ratings for each solution
        for solution in self.solutions:
            print(f"Adding comments and ratings for solution: {solution['name']}")

            # Add comments
            for _ in range(num_comments_per_solution):
                self.create_comment(solution["slug"])

            # Add ratings
            for _ in range(num_ratings_per_solution):
                self.create_rating(solution["slug"])

            # Update review status from weighted distribution
            self.update_solution_review_status(solution["slug"])

        print("Test data generation completed successfully!")


def main():
    try:
        generator = TestDataGenerator()
        generator.generate_test_data()
    except requests.exceptions.RequestException as e:
        print(f"Error occurred during API request: {e}")
        if hasattr(e.response, "text"):
            print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"Unexpected error occurred: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
