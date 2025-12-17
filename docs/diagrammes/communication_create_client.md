# Diagramme de Communication - CreateClientPage()

## Description
Ce diagramme illustre les interactions entre les composants lors de la création d'un nouveau client dans le système SYGLA-H2O.

## Diagramme UML de Communication

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          DIAGRAMME DE COMMUNICATION - CreateClientPage()                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐                                                                                      
    │ :Actor  │                                                                                      
    │(Vendeur/│                                                                                      
    │ Admin)  │                                                                                      
    └────┬────┘                                                                                      
         │                                                                                           
         │ 1: remplitFormulaire(formData)                                                           
         │                                                                                           
         ▼                                                                                           
┌─────────────────┐     2: handleSubmit(event)      ┌──────────────────┐                            
│                 │─────────────────────────────────▶│                  │                            
│ CreateClientPage│                                 │   useState()     │                            
│   (React Page)  │◀────────────────────────────────│   (isLoading,    │                            
│                 │     2.1: setIsLoading(true)     │    formData)     │                            
└────────┬────────┘                                 └──────────────────┘                            
         │                                                                                           
         │ 3: validateFormData(formData)                                                            
         │    [validation locale]                                                                   
         │    • telephone non vide                                                                  
         │    • adresse avec lettres                                                                
         │    • email valide                                                                        
         │    • nom_commercial OU raison_sociale                                                    
         │                                                                                           
         │ 4: create(clientData)                                                                    
         ▼                                                                                           
┌─────────────────┐                                                                                  
│                 │                                                                                  
│ clientService   │                                                                                  
│   (api.js)      │                                                                                  
│                 │                                                                                  
└────────┬────────┘                                                                                  
         │                                                                                           
         │ 5: POST('/clients/', clientData)                                                         
         ▼                                                                                           
┌─────────────────┐     6: addAuthHeader(token)     ┌──────────────────┐                            
│                 │─────────────────────────────────▶│                  │                            
│   Axios API     │                                 │  localStorage    │                            
│  (Interceptor)  │◀────────────────────────────────│  (access_token)  │                            
│                 │     6.1: return JWT token       │                  │                            
└────────┬────────┘                                 └──────────────────┘                            
         │                                                                                           
         │ 7: HTTP POST /api/clients/                                                               
         │    Headers: { Authorization: Bearer <JWT> }                                              
         │    Body: { type_client, nom_commercial, raison_sociale,                                  
         │           telephone, adresse, contact, email, notes }                                    
         │                                                                                           
         ▼                                                                                           
┌─────────────────────────────────────────────────────────────────────────────────────────┐          
│                              BACKEND DJANGO REST FRAMEWORK                               │          
├─────────────────────────────────────────────────────────────────────────────────────────┤          
│                                                                                          │          
│  ┌──────────────────┐    8: authenticate(token)    ┌──────────────────┐                 │          
│  │                  │─────────────────────────────▶│                  │                 │          
│  │   urls.py        │                              │ JWTAuthentication│                 │          
│  │   (Router)       │◀────────────────────────────│   (Simple JWT)   │                 │          
│  │                  │    8.1: return user          │                  │                 │          
│  └────────┬─────────┘                              └──────────────────┘                 │          
│           │                                                                              │          
│           │ 9: route to ClientListCreateView                                            │          
│           ▼                                                                              │          
│  ┌──────────────────┐                                                                   │          
│  │                  │    10: check_permission(user)                                     │          
│  │ClientListCreate  │──────────────────────────────────────────────────────────┐        │          
│  │    View          │    [IsAuthenticated + can_manage_orders()]               │        │          
│  │  (views.py)      │                                                          │        │          
│  │                  │◀─────────────────────────────────────────────────────────┘        │          
│  └────────┬─────────┘    10.1: permission granted (admin/vendeur)                       │          
│           │                                                                              │          
│           │ 11: create(request)                                                         │          
│           │     with LogTimer()                                                         │          
│           ▼                                                                              │          
│  ┌──────────────────┐    12: validate(data)        ┌──────────────────┐                 │          
│  │                  │─────────────────────────────▶│                  │                 │          
│  │ ClientSerializer │                              │   Validators     │                 │          
│  │ (serializers.py) │◀────────────────────────────│  • telephone     │                 │          
│  │                  │    12.1: validated_data      │  • credit_limite │                 │          
│  └────────┬─────────┘                              └──────────────────┘                 │          
│           │                                                                              │          
│           │ 13: save()                                                                  │          
│           ▼                                                                              │          
│  ┌──────────────────┐    14: INSERT INTO           ┌──────────────────┐                 │          
│  │                  │─────────────────────────────▶│                  │                 │          
│  │  Client Model    │      clients_client          │   PostgreSQL     │                 │          
│  │   (models.py)    │◀────────────────────────────│   Database       │                 │          
│  │                  │    14.1: client created      │                  │                 │          
│  └────────┬─────────┘                              └──────────────────┘                 │          
│           │                                                                              │          
│           │ 15: create_log(success, metadata)                                           │          
│           ▼                                                                              │          
│  ┌──────────────────┐    16: INSERT INTO           ┌──────────────────┐                 │          
│  │                  │─────────────────────────────▶│                  │                 │          
│  │   LogService     │      logs_systemlog          │   PostgreSQL     │                 │          
│  │  (logs/utils.py) │◀────────────────────────────│   Database       │                 │          
│  │                  │    16.1: log created         │                  │                 │          
│  └──────────────────┘                              └──────────────────┘                 │          
│                                                                                          │          
└─────────────────────────────────────────────────────────────────────────────────────────┘          
         │                                                                                           
         │ 17: HTTP Response 201 Created                                                            
         │     { id, type_client, nom_commercial, raison_sociale,                                   
         │       telephone, adresse, contact, email, credit_limite,                                 
         │       credit_utilise, credit_disponible, ... }                                           
         │                                                                                           
         ▼                                                                                           
┌─────────────────┐                                                                                  
│                 │                                                                                  
│ clientService   │                                                                                  
│                 │                                                                                  
└────────┬────────┘                                                                                  
         │                                                                                           
         │ 18: return response.data                                                                 
         ▼                                                                                           
┌─────────────────┐                                                                                  
│                 │    19: triggerDashboardUpdate()  ┌──────────────────┐                            
│ CreateClientPage│─────────────────────────────────▶│ DataUpdateContext│                            
│                 │                                  │                  │                            
│                 │    20: toast.success()           └──────────────────┘                            
│                 │─────────────────────────────────▶┌──────────────────┐                            
│                 │                                  │  react-hot-toast │                            
│                 │                                  │                  │                            
│                 │    21: navigate('/clients')      └──────────────────┘                            
│                 │─────────────────────────────────▶┌──────────────────┐                            
│                 │                                  │  useNavigate()   │                            
│                 │◀────────────────────────────────│  (React Router)  │                            
└─────────────────┘    21.1: redirect to ClientList └──────────────────┘                            


```

## Séquence des Messages

| # | Source | Destination | Message | Description |
|---|--------|-------------|---------|-------------|
| 1 | Actor | CreateClientPage | `remplitFormulaire(formData)` | L'utilisateur remplit le formulaire de création |
| 2 | CreateClientPage | useState | `handleSubmit(event)` | Soumission du formulaire |
| 2.1 | useState | CreateClientPage | `setIsLoading(true)` | Activation de l'état de chargement |
| 3 | CreateClientPage | CreateClientPage | `validateFormData()` | Validation locale des données |
| 4 | CreateClientPage | clientService | `create(clientData)` | Appel du service API |
| 5 | clientService | Axios | `POST('/clients/', data)` | Préparation de la requête HTTP |
| 6 | Axios | localStorage | `addAuthHeader()` | Récupération du token JWT |
| 7 | Axios | Django URLs | `HTTP POST /api/clients/` | Envoi de la requête HTTP |
| 8 | urls.py | JWTAuthentication | `authenticate(token)` | Vérification du token JWT |
| 9 | urls.py | ClientListCreateView | `route()` | Routage vers la vue |
| 10 | ClientListCreateView | User | `check_permission()` | Vérification des permissions |
| 11 | ClientListCreateView | ClientSerializer | `create(request)` | Création avec timer |
| 12 | ClientSerializer | Validators | `validate(data)` | Validation des données |
| 13 | ClientSerializer | Client Model | `save()` | Sauvegarde du modèle |
| 14 | Client Model | PostgreSQL | `INSERT INTO` | Insertion en base de données |
| 15 | ClientListCreateView | LogService | `create_log()` | Journalisation de l'action |
| 16 | LogService | PostgreSQL | `INSERT INTO` | Sauvegarde du log |
| 17 | Django | Axios | `Response 201` | Réponse HTTP succès |
| 18 | Axios | CreateClientPage | `return data` | Retour des données |
| 19 | CreateClientPage | DataUpdateContext | `triggerDashboardUpdate()` | Mise à jour du dashboard |
| 20 | CreateClientPage | toast | `success()` | Notification de succès |
| 21 | CreateClientPage | useNavigate | `navigate('/clients')` | Redirection vers la liste |

## Objets Participants

### Frontend (React)

| Objet | Type | Responsabilité |
|-------|------|----------------|
| `CreateClientPage` | React Component | Interface utilisateur pour la création de client |
| `useState` | React Hook | Gestion de l'état local (formData, isLoading) |
| `clientService` | Service API | Abstraction des appels HTTP pour les clients |
| `Axios API` | HTTP Client | Client HTTP avec intercepteurs |
| `localStorage` | Web Storage | Stockage du token JWT |
| `DataUpdateContext` | React Context | Synchronisation des données entre composants |
| `useNavigate` | React Router Hook | Navigation programmatique |
| `toast` | react-hot-toast | Notifications utilisateur |

### Backend (Django REST Framework)

| Objet | Type | Responsabilité |
|-------|------|----------------|
| `urls.py` | URL Router | Routage des requêtes HTTP |
| `JWTAuthentication` | Auth Class | Authentification par token JWT |
| `ClientListCreateView` | APIView | Traitement de la requête de création |
| `ClientSerializer` | Serializer | Validation et sérialisation des données |
| `Client` | Django Model | Modèle de données client |
| `LogService` | Utility | Journalisation des actions |
| `PostgreSQL` | Database | Persistance des données |

## Flux de Données

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DONNÉES ÉCHANGÉES                              │
└─────────────────────────────────────────────────────────────────────────┘

ENTRÉE (formData):
{
  type_client: "entreprise" | "particulier",
  nom_commercial: string,
  raison_sociale: string,
  telephone: string (validé: regex),
  adresse: string (validé: contient des lettres),
  contact: string (requis),
  email: string (optionnel, validé),
  notes: string (optionnel)
}

SORTIE (Response 201):
{
  id: number,
  type_client: string,
  nom_commercial: string,
  raison_sociale: string,
  telephone: string,
  adresse: string,
  contact: string,
  email: string,
  credit_limite: decimal,
  credit_utilise: decimal,
  credit_disponible: decimal,
  peut_commander: boolean,
  total_depenses: decimal,
  date_creation: datetime,
  date_modification: datetime,
  is_active: boolean,
  notes: string
}
```

## Gestion des Erreurs

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAS D'ERREUR                                   │
└─────────────────────────────────────────────────────────────────────────┘

1. VALIDATION FRONTEND (étape 3):
   - Téléphone vide → toast.error("Champs obligatoires...")
   - Adresse sans lettres → toast.error("L'adresse doit contenir...")
   - Email invalide → toast.error("L'email doit contenir...")
   - Aucun nom fourni → toast.error("Veuillez fournir au moins un nom...")

2. AUTHENTIFICATION (étape 8):
   - Token invalide/expiré → HTTP 401 → toast.error("Non autorisé...")

3. PERMISSION (étape 10):
   - Rôle non autorisé → HTTP 403 → toast.error("Permission refusée...")

4. VALIDATION BACKEND (étape 12):
   - Données invalides → HTTP 400 → toast.error(errors)

5. BASE DE DONNÉES (étape 14):
   - Erreur d'insertion → HTTP 500 → toast.error("Erreur serveur...")
```

## Notes Techniques

1. **Authentification**: JWT (JSON Web Token) stocké dans localStorage
2. **Permissions**: Seuls les rôles `admin` et `vendeur` peuvent créer des clients
3. **Journalisation**: Chaque création est tracée avec métadonnées complètes
4. **Validation**: Double validation (frontend + backend) pour sécurité
5. **Transaction**: PostgreSQL assure l'intégrité des données (ACID)
