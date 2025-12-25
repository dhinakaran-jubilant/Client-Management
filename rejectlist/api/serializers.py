from rest_framework import serializers
from .models import RejectList


class RejectListSerializer(serializers.ModelSerializer):
    class Meta:
        model = RejectList
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")