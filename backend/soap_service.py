from spyne import rpc, ServiceBase, String, Array, ComplexModel, Fault
from services import (
    create_fir, update_fir_status, upload_evidence, add_fir_witness,
    add_fir_criminal, get_fir_details, get_criminal_relations,
    get_all_firs, get_all_criminals, get_witnesses_by_fir, get_evidence_by_fir
)
from auth import authenticate_user, generate_token, verify_token

# Complex types
class FamilyRelation(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    cnic = String
    full_name = String
    alias = String
    date_of_birth = String
    address = String
    relationship_type = String

class Criminal(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    criminal_id = String
    role = String
    family_relations = Array(FamilyRelation)

class AuthHeader(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    token = String

class FIRListItem(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    fir_id = String
    fir_number = String
    title = String
    status = String
    date_filed = String

class CriminalListItem(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    criminal_id = String
    full_name = String
    alias = String
    address = String

class WitnessListItem(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    witness_id = String
    full_name = String
    statement = String

class EvidenceListItem(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    evidence_id = String
    description = String
    file_path = String

# Response models
class LoginResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    token = String
    role = String

class CreateFIRResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    message = String
    fir_id = String
    fir_number = String

class UpdateFIRStatusResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    message = String

class UploadEvidenceResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    message = String

class AddWitnessResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    message = String

class AddCriminalResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    message = String

class GetFIRDetailsResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    fir_number = String
    title = String
    description = String
    status = String
    date_filed = String

class GetCriminalRelationsResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    grandfather = String
    father = String
    son = String
    grandson = String

class GetAllFIRsResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    firs = Array(FIRListItem)

class GetAllCriminalsResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    criminals = Array(CriminalListItem)

class GetWitnessesResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    witnesses = Array(WitnessListItem)

class GetEvidenceResponse(ComplexModel):
    __namespace__ = 'http://fir.system/soap'
    evidence_list = Array(EvidenceListItem)

# Service
class FIRService(ServiceBase):
    __in_header__ = AuthHeader

    @classmethod
    def _get_user(cls, ctx):
        """Authenticate user from SOAP header token."""
        if not ctx.in_header or not ctx.in_header.token:
            raise Fault('Client.Authentication', 'Missing token')
        user = verify_token(ctx.in_header.token)
        if not user:
            raise Fault('Client.Authentication', 'Invalid or expired token')
        return user

    @rpc(String, String, _returns=LoginResponse)
    def login(ctx, email, password):
        user = authenticate_user(email, password)
        if not user:
            raise Fault('Client.Authentication', 'Invalid email or password')
        token = generate_token(user['user_id'], user['role'])
        return LoginResponse(token=token, role=user['role'])

    @rpc(String, String, String, String, String, String, Array(Criminal), _returns=CreateFIRResponse)
    def createFIR(ctx, title, description, citizen_id, officer_id, station_id, category_id, criminals=None):
        user = FIRService._get_user(ctx)
        if user['role'] not in ('Officer', 'Citizen'):
            raise Fault('Client.Authorization', 'Insufficient privileges')
        data = {
            'title': title, 'description': description, 'citizen_id': citizen_id,
            'officer_id': officer_id, 'station_id': station_id, 'category_id': category_id
        }
        criminal_list = []
        if criminals:
            for crim in criminals:
                fam_rels = []
                if crim.family_relations:
                    for rel in crim.family_relations:
                        fam_rels.append({
                            'cnic': rel.cnic, 'full_name': rel.full_name, 'alias': rel.alias,
                            'date_of_birth': rel.date_of_birth, 'address': rel.address,
                            'relationship_type': rel.relationship_type
                        })
                criminal_list.append({
                    'criminal_id': crim.criminal_id,
                    'role': crim.role,
                    'family_relations': fam_rels
                })
        result = create_fir(data, criminal_list)
        if 'error' in result:
            raise Fault('Server.Database', result['error'])
        return CreateFIRResponse(
            message=result['message'],
            fir_id=result['fir_id'],
            fir_number=result['fir_number']
        )

    @rpc(String, String, String, String, _returns=UpdateFIRStatusResponse)
    def updateFIRStatus(ctx, fir_id, status, officer_id, remarks):
        user = FIRService._get_user(ctx)
        if user['role'] != 'Officer':
            raise Fault('Client.Authorization', 'Only officers can update status')
        result = update_fir_status(fir_id, status, officer_id, remarks)
        if 'error' in result:
            raise Fault('Server.Database', result['error'])
        return UpdateFIRStatusResponse(message=result['message'])

    @rpc(String, String, String, String, _returns=UploadEvidenceResponse)
    def uploadEvidence(ctx, fir_id, description, file_path, uploaded_by):
        user = FIRService._get_user(ctx)
        if user['role'] != 'Officer':
            raise Fault('Client.Authorization', 'Only officers can upload evidence')
        result = upload_evidence({
            'fir_id': fir_id, 'description': description,
            'file_path': file_path, 'uploaded_by': uploaded_by
        })
        if 'error' in result:
            raise Fault('Server.Database', result['error'])
        return UploadEvidenceResponse(message=result['message'])

    @rpc(String, String, String, String, _returns=AddWitnessResponse)
    def addWitness(ctx, fir_id, full_name, contact_info, statement):
        user = FIRService._get_user(ctx)
        if user['role'] != 'Officer':
            raise Fault('Client.Authorization', 'Only officers can add witnesses')
        result = add_fir_witness({
            'fir_id': fir_id, 'full_name': full_name,
            'contact_info': contact_info, 'statement': statement
        })
        if 'error' in result:
            raise Fault('Server.Database', result['error'])
        return AddWitnessResponse(message=result['message'])

    @rpc(String, String, String, _returns=AddCriminalResponse)
    def addCriminal(ctx, fir_id, criminal_id, role):
        user = FIRService._get_user(ctx)
        if user['role'] != 'Officer':
            raise Fault('Client.Authorization', 'Only officers can link criminals')
        result = add_fir_criminal({
            'fir_id': fir_id, 'criminal_id': criminal_id, 'role': role
        })
        if 'error' in result:
            raise Fault('Server.Database', result['error'])
        return AddCriminalResponse(message=result['message'])

    @rpc(String, _returns=GetFIRDetailsResponse)
    def getFIRDetails(ctx, fir_id):
        user = FIRService._get_user(ctx)
        result = get_fir_details(fir_id, user)
        if 'error' in result:
            raise Fault('Server.Database', result['error'])
        return GetFIRDetailsResponse(
            fir_number=result['fir_number'],
            title=result['title'],
            description=result['description'],
            status=result['status'],
            date_filed=result['date_filed']
        )

    @rpc(String, _returns=GetCriminalRelationsResponse)
    def getCriminalRelations(ctx, criminal_id):
        FIRService._get_user(ctx)  # just authenticate
        result = get_criminal_relations(criminal_id)
        if 'error' in result:
            raise Fault('Server.Database', result['error'])
        return GetCriminalRelationsResponse(
            grandfather=result.get('grandfather', ''),
            father=result.get('father', ''),
            son=result.get('son', ''),
            grandson=result.get('grandson', '')
        )

    @rpc(_returns=GetAllFIRsResponse)
    def getAllFIRs(ctx):
        FIRService._get_user(ctx)
        firs = get_all_firs()
        items = []
        for f in firs:
            items.append(FIRListItem(
                fir_id=str(f[0]), fir_number=f[1], title=f[2],
                status=f[3], date_filed=str(f[4]) if f[4] else ''
            ))
        return GetAllFIRsResponse(firs=items)

    @rpc(_returns=GetAllCriminalsResponse)
    def getAllCriminals(ctx):
        FIRService._get_user(ctx)
        criminals = get_all_criminals()
        items = []
        for c in criminals:
            items.append(CriminalListItem(
                criminal_id=str(c[0]), full_name=c[1],
                alias=c[2] if c[2] else '', address=c[3] if c[3] else ''
            ))
        return GetAllCriminalsResponse(criminals=items)

    @rpc(String, _returns=GetWitnessesResponse)
    def getWitnessesByFIR(ctx, fir_id):
        FIRService._get_user(ctx)
        witnesses = get_witnesses_by_fir(fir_id)
        items = []
        for w in witnesses:
            items.append(WitnessListItem(
                witness_id=str(w[0]), full_name=w[1],
                statement=w[2] if w[2] else ''
            ))
        return GetWitnessesResponse(witnesses=items)

    @rpc(String, _returns=GetEvidenceResponse)
    def getEvidenceByFIR(ctx, fir_id):
        FIRService._get_user(ctx)
        evidence = get_evidence_by_fir(fir_id)
        items = []
        for e in evidence:
            items.append(EvidenceListItem(
                evidence_id=str(e[0]), description=e[1], file_path=e[2]
            ))
        return GetEvidenceResponse(evidence_list=items)
