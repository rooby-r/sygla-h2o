from django.urls import path
from . import views
from . import test_pdf

urlpatterns = [
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    path('sales/', views.sales_report, name='sales-report'),
    path('inventory/', views.inventory_report, name='inventory-report'),
    path('clients/', views.client_report, name='client-report'),
    path('deliveries/', views.delivery_report, name='delivery-report'),
    path('export-pdf/', views.export_pdf_report, name='export-pdf-report'),
    path('test-pdf/', test_pdf.test_pdf_simple, name='test-pdf'),
]