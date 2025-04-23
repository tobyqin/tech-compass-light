from app.services.solution_service import generate_slug

def test_generate_slug():
    # Test with a valid title
    title = "Test Title"
    expected_slug = "test-title"
    assert generate_slug(title) == expected_slug