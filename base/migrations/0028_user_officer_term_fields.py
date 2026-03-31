from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0027_user_department'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='officer_ends_at',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='officer_started_at',
            field=models.DateField(blank=True, null=True),
        ),
    ]
