from typing import List, Literal, Optional

from app.models import AuditModel
from pydantic import BaseModel, Field

# Stage values as defined in db-design.md
StageEnum = Literal[
    "DEVELOPING",  # Solution is under active development
    "UAT",  # Release Candidate
    "PRODUCTION",  # Actively used in production
    "DEPRECATED",  # No longer recommended for new projects
    "RETIRED",  # Completely phased out
]

# Recommend status values as defined in db-design.md
RecommendStatusEnum = Literal[
    "ADOPT",  # Proven technology, safe to use
    "TRIAL",  # Worth pursuing, understand how it fits
    "ASSESS",  # Worth exploring with the goal of understanding how it will affect your enterprise
    "HOLD",  # Proceed with caution
]

# Adoption level values
AdoptionLevelEnum = Literal[
    "PILOT",  # Pilot phase or proof of concept
    "TEAM",  # Used by single team
    "DEPARTMENT",  # Used across department
    "ENTERPRISE",  # Used across enterprise
    "INDUSTRY",  # Industry standard
]

# Adoption complexity values
AdoptionComplexityEnum = Literal[
    "AUTOMATED",  # Solution can be adopted with automated processes without human intervention
    "EASY",  # Simple adoption requiring minimal manual effort
    "SUPPORT_REQUIRED",  # Adoption requires technical support or significant manual effort
]

# Provider type values
ProviderTypeEnum = Literal[
    "VENDOR",  # Solution provided by an external vendor
    "INTERNAL",  # Solution developed internally
]

# Review status values - only superusers can change it
ReviewStatusEnum = Literal[
    "PENDING",  # Awaiting review
    "APPROVED",  # Approved by admin
    "REJECTED",  # Rejected by admin
]


class SolutionBase(BaseModel):
    """Base solution model with common fields"""

    group: str = Field(default="Default", description="Group identifier for organizing solutions")
    name: str = Field(..., min_length=1, description="Solution name")
    description: str = Field(..., description="Detailed description, markdown supported")
    brief: str = Field(
        ...,
        max_length=200,
        description="Brief description of the solution (max 200 chars)",
    )
    replaced_by: Optional[str] = Field(
        default="default solution", description="name of the solution that replaces this one"
    )
    how_to_use: Optional[str] = Field("", description="Instructions on how to use the solution, markdown supported")
    how_to_use_url: Optional[str] = Field(None, description="External URL for how-to-use guide")
    faq: Optional[str] = Field("", description="Frequently asked questions about the solution, markdown supported")
    about: Optional[str] = Field("", description="Additional information about the solution, markdown supported")
    logo: Optional[str] = Field("", description="Logo URL or path")
    category: Optional[str] = Field(None, description="Primary category")
    department: str = Field(..., description="Department name")
    team: str = Field(..., description="Team name")
    team_email: Optional[str] = Field(None, description="Team contact email")
    maintainer_id: Optional[str] = Field(None, description="ID of the maintainer")
    maintainer_name: Optional[str] = Field(None, description="Name of the maintainer")
    maintainer_email: Optional[str] = Field(None, description="Email of the maintainer")
    official_website: Optional[str] = Field(None, description="Official website URL")
    documentation_url: Optional[str] = Field(None, description="Documentation URL")
    demo_url: Optional[str] = Field(None, description="Demo/POC URL")
    support_url: Optional[str] = Field(None, description="Support page URL")
    vendor_product_url: Optional[str] = Field(None, description="Vendor product website URL")
    version: Optional[str] = Field(None, description="Current version")
    upskilling: Optional[str] = Field(
        default="",
        description="Information on how to gain skills with this solution (training, certifications, etc.), markdown supported",
    )
    provider_type: Optional[ProviderTypeEnum] = Field(
        default="INTERNAL",
        description="Provider of the solution (VENDOR/INTERNAL)",
    )
    adoption_level: Optional[AdoptionLevelEnum] = Field(
        default="PILOT",
        description="Current adoption level (PILOT/TEAM/DEPARTMENT/ENTERPRISE/INDUSTRY)",
    )
    adoption_complexity: Optional[AdoptionComplexityEnum] = Field(
        default="EASY",
        description="Complexity of adoption (AUTOMATED/EASY/SUPPORT_REQUIRED)",
    )
    adoption_user_count: Optional[int] = Field(0, ge=0, description="Number of users currently using this solution")
    tags: List[str] = Field(default_factory=list, description="List of tag names")
    pros: Optional[List[str]] = Field(default_factory=list, description="List of advantages")
    cons: Optional[List[str]] = Field(default_factory=list, description="List of disadvantages")
    stage: Optional[StageEnum] = Field(default="UAT", description="Development stage status")
    recommend_status: Optional[RecommendStatusEnum] = Field(
        default="ASSESS",
        description="Strategic recommendation (ADOPT/TRIAL/ASSESS/HOLD)",
    )


class SolutionCreate(SolutionBase):
    """Solution creation model - excludes review_status field"""

    pass


class SolutionInDBBase(SolutionBase):
    """Base model for database solutions with review status"""

    review_status: ReviewStatusEnum = Field(default="PENDING", description="Review status (PENDING/APPROVED/REJECTED)")


class SolutionUpdate(BaseModel):
    """Solution update model - all fields are optional"""

    group: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    brief: Optional[str] = None
    how_to_use: Optional[str] = None
    how_to_use_url: Optional[str] = None
    faq: Optional[str] = None
    about: Optional[str] = None
    logo: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    team: Optional[str] = None
    team_email: Optional[str] = None
    maintainer_id: Optional[str] = None
    maintainer_name: Optional[str] = None
    maintainer_email: Optional[str] = None
    official_website: Optional[str] = None
    documentation_url: Optional[str] = None
    demo_url: Optional[str] = None
    support_url: Optional[str] = None
    vendor_product_url: Optional[str] = None
    version: Optional[str] = None
    upskilling: Optional[str] = None
    provider_type: Optional[ProviderTypeEnum] = None
    adoption_level: Optional[AdoptionLevelEnum] = None
    adoption_complexity: Optional[AdoptionComplexityEnum] = None
    adoption_user_count: Optional[int] = None
    tags: Optional[List[str]] = None
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None
    stage: Optional[StageEnum] = None
    recommend_status: Optional[RecommendStatusEnum] = None
    review_status: Optional[ReviewStatusEnum] = None
    replaced_by: Optional[str] = None


class SolutionInDB(SolutionInDBBase, AuditModel):
    """Solution model as stored in database"""

    slug: str = Field(..., description="URL-friendly identifier (auto-generated)")


class Solution(SolutionInDB):
    """Solution model for API responses, including rating information"""

    rating: float = Field(default=0.0, description="Average rating score")
    rating_count: int = Field(default=0, description="Total number of ratings")
