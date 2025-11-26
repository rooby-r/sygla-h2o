"""
Vue temporaire simplifiée pour tester la génération de PDF
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import io

@api_view(['GET'])
@permission_classes([])
def test_pdf_simple(request):
    """Test simple de génération PDF"""
    try:
        print("\n" + "="*80)
        print("TEST GÉNÉRATION PDF SIMPLE")
        print("="*80)
        
        # Créer un buffer
        buffer = io.BytesIO()
        print("1. Buffer créé")
        
        # Créer le canvas
        c = canvas.Canvas(buffer, pagesize=A4)
        print("2. Canvas créé")
        
        # Ajouter du contenu
        c.drawString(100, 750, "Test PDF - SYGLA-H2O")
        c.drawString(100, 700, f"Date: {timezone.now().strftime('%d/%m/%Y %H:%M')}")
        print("3. Contenu ajouté")
        
        # Sauvegarder
        c.save()
        print("4. PDF sauvegardé")
        
        # Récupérer les données
        pdf = buffer.getvalue()
        buffer.close()
        print(f"5. PDF récupéré: {len(pdf)} bytes")
        
        # Créer la réponse
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="test.pdf"'
        print("6. Réponse créée - SUCCÈS!")
        print("="*80 + "\n")
        
        return response
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        print(f"\nERREUR: {error_msg}")
        print(f"Traceback:\n{error_trace}")
        print("="*80 + "\n")
        
        return Response({
            'error': error_msg,
            'traceback': error_trace
        }, status=500)
