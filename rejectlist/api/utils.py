from django.contrib.auth.models import Group

def create_user_groups():
    """Create necessary user groups if they don't exist"""
    manager_group, created = Group.objects.get_or_create(name='Manager')
    return manager_group


def assign_user_to_group(username, group_name):
    """Assign a user to a specific group"""
    try:
        from django.contrib.auth.models import User, Group
        user = User.objects.get(username=username)
        group = Group.objects.get(name=group_name)
        user.groups.add(group)
        user.save()
        return True
    except (User.DoesNotExist, Group.DoesNotExist):
        return False