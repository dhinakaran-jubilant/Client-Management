from django.db import models
from django.utils import timezone
import pytz

class RejectList(models.Model):
    id = models.IntegerField(primary_key=True, blank=True)
    group = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=225, null=True, blank=True)
    proposal_date = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    follow = models.CharField(max_length=100, null=True, blank=True)
    proprietor = models.CharField(max_length=100, null=True, blank=True)
    mediator = models.CharField(max_length=100, null=True, blank=True)
    contact_no = models.CharField(max_length=20, null=True, blank=True)
    file_seen = models.CharField(max_length=10, null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'reject_client_details'
        managed = False

    def save(self, *args, **kwargs):
        IST = pytz.timezone("Asia/Kolkata")
        now = timezone.now().astimezone(IST)

        if not self.created_at:
            self.created_at = now

        self.updated_at = now

        super().save(*args, **kwargs)

    @property
    def year(self):
        return self.proposal_date.year if self.proposal_date else None

    @property
    def month(self):
        return self.proposal_date.month if self.proposal_date else None
