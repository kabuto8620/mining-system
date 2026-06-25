from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import bcrypt
import jwt
import datetime
import os
import io

app = Flask(__name__)
#CORS(app, origins="*", supports_credentials=True, allow_headers="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', '*')
    response.headers.add('Access-Control-Allow-Methods', '*')
    return response
@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 204
SECRET_KEY = "mining_secret_2024_secure"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "mining.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        area TEXT NOT NULL,
        number INTEGER,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'operational',
        last_maintenance TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(area, number, name)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        specification TEXT,
        quantity INTEGER DEFAULT 1,
        status TEXT DEFAULT 'good',
        FOREIGN KEY(equipment_id) REFERENCES equipment(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER,
        type TEXT,
        description TEXT,
        technician TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        next_maintenance TIMESTAMP,
        FOREIGN KEY(equipment_id) REFERENCES equipment(id)
    )''')

    existing = c.execute("SELECT id FROM users WHERE username='admin'").fetchone()
    new_hash = bcrypt.hashpw("LadminZ".encode(), bcrypt.gensalt()).decode()
    if existing:
        c.execute("UPDATE users SET password=?, role='admin' WHERE username='admin'", (new_hash,))
    else:
        c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')", ("admin", new_hash))
    c.execute("DELETE FROM users WHERE username != 'admin'")

    areas = [
        ("TRITURACION", [(1,"CHANCADORA PRIMARIO"),(2,"CINTA TRANSPORTADORA PRIMARIO"),(3,"ZARANDA VIBRATORIO"),(4,"CHANCADORA SECUNDARIO"),(5,"CINTA TRANSPORTADORA SECUNDARIO")]),
        ("MOLIENDA", [(1,"CINTA TRANSPORTADORA DE CARGA"),(2,"MOLINO DE BOLA PRINCIPAL"),(3,"CICLON SELECIONADOR"),(4,"MOLINO DE BOLA SECUNDARIO"),(5,"BOMBA LAMERA"),(6,"ACONDICIONADOR")]),
        ("FLOTACION", [(1,"CELDAS DE FLOTACION"),(2,"REACTIVEROS"),(3,"ACONDICIONADOR")]),
        ("RECIRCULACION", [(1,"BOMBA DE AGUA")])
    ]
    for area, equips in areas:
        for num, name in equips:
            c.execute("INSERT OR IGNORE INTO equipment (area, number, name, status) VALUES (?,?,?,?)", (area, num, name, "operational"))

    row = c.execute("SELECT id FROM equipment WHERE name='BOMBA DE AGUA' AND area='RECIRCULACION'").fetchone()
    if row:
        eid = row[0]
        existing_count = c.execute("SELECT COUNT(*) FROM components WHERE equipment_id=?", (eid,)).fetchone()[0]
        if existing_count < 30:
            c.execute("DELETE FROM components WHERE equipment_id=?", (eid,))
            comps = [
                # MOTOR TRIFASICO (DATOS TECNICOS - MARCA: WEG)
                ("MOTOR TRIFASICO","MARCA","WEG"),
                ("MOTOR TRIFASICO","TIPO","W22"),
                ("MOTOR TRIFASICO","TRIFASICO","TRIFASICO"),
                ("MOTOR TRIFASICO","VOLTAJE","220 V - 380 V"),
                ("MOTOR TRIFASICO","CORRIENTE","30.7 A"),
                ("MOTOR TRIFASICO","FRECUENCIA","50 Hz"),
                ("MOTOR TRIFASICO","FACTOR DE POTENCIA","0,90"),
                ("MOTOR TRIFASICO","RPM","2800 rpm"),
                ("MOTOR TRIFASICO","IP","55"),
                ("MOTOR TRIFASICO","PERNO DE AJUSTE","3/4\""),
                ("MOTOR TRIFASICO","VOLANDA PLANA","3/4\""),
                ("MOTOR TRIFASICO","VOLANDA DE PRESION","3/4\""),
                ("MOTOR TRIFASICO","TUERCA DE FIJACION","3/4\""),
                # BOMBA DE AGUA (DATOS TECNICOS - MARCA: CAPRARI)
                ("BOMBA DE AGUA","MARCA","CAPRARI"),
                ("BOMBA DE AGUA","S/N","795395/5"),
                ("BOMBA DE AGUA","TYPE","MEC-A2/80A"),
                ("BOMBA DE AGUA","Hmax","100 m"),
                ("BOMBA DE AGUA","MEI≥","0.40"),
                ("BOMBA DE AGUA","ORIGEN","MODENA - ITALY"),
                ("BOMBA DE AGUA","LUBRICANTE","LUBRICANTE"),
                ("BOMBA DE AGUA","PERNO DE AJUSTE","5/8\""),
                ("BOMBA DE AGUA","VOLANDA PLANA","5/8\""),
                ("BOMBA DE AGUA","VOLANDA DE PRESION","5/8\""),
                ("BOMBA DE AGUA","TUERCA DE FIJACION","5/8\""),
                # SUCCION
                ("SUCCION","CHUPADOR","DE 4\""),
                ("SUCCION","MANGUERA DE ASPIRACION","DE 4\""),
                ("SUCCION","BRIDA DE ACOPLE","4\" DE 8 PRF. 5/8\" e=10"),
                ("SUCCION","EMPAQUE DE BRIDA","DE 4\""),
                ("SUCCION","PERNO DE AJUSTE","5/8\""),
                ("SUCCION","VOLANDA PLANA","5/8\""),
                ("SUCCION","VOLANDA DE PRESION","5/8\""),
                ("SUCCION","TUERCA DE FIJACION","5/8\""),
                ("SUCCION","ABRAZADERA","DE 4\""),
                # EXPULSION
                ("EXPULSION","BRIDA DE ACOPLE","3\" DE 8 PRF. 5/8\" e=10"),
                ("EXPULSION","EMPAQUE DE BRIDA","DE 3\""),
                ("EXPULSION","PERNO DE AJUSTE","5/8\""),
                ("EXPULSION","VOLANDA PLANA","5/8\""),
                ("EXPULSION","VOLANDA DE PRESION","5/8\""),
                ("EXPULSION","TUERCA DE FIJACION","5/8\""),
                ("EXPULSION","LLAVE DE PASO DE BOLA","DE 3\""),
                ("EXPULSION","BRIDA DE ACOPLE 2","4\" DE 8 PRF. 5/8\" e=10"),
                ("EXPULSION","EMPAQUE DE BRIDA 2","DE 4\""),
                ("EXPULSION","PERNO DE AJUSTE 2","5/8\""),
                ("EXPULSION","VOLANDA PLANA 2","5/8\""),
                ("EXPULSION","VOLANDA DE PRESION 2","5/8\""),
                ("EXPULSION","TUERCA DE FIJACION 2","5/8\""),
                ("EXPULSION","ABRAZADERA","DE 4\""),
                ("EXPULSION","MANGUERA TIPO HDPE","DE 4\""),
            ]
            for cat, name, spec in comps:
                c.execute("INSERT INTO components (equipment_id, category, name, specification) VALUES (?,?,?,?)", (eid, cat, name, spec))

    conn.commit()
    conn.close()

def token_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token requerido'}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user = data
        except:
            return jsonify({'error': 'Token inválido'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username=?", (data.get('username'),)).fetchone()
    conn.close()
    if not user or not bcrypt.checkpw(data.get('password','').encode(), user['password'].encode()):
        return jsonify({'error': 'Credenciales incorrectas'}), 401
    token = jwt.encode({
        'id': user['id'], 'username': user['username'], 'role': user['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }, SECRET_KEY, algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': user['id'], 'username': user['username'], 'role': user['role']}})

@app.route('/api/equipment', methods=['GET'])
@token_required
def get_equipment():
    area = request.args.get('area')
    conn = get_db()
    if area:
        rows = conn.execute("SELECT * FROM equipment WHERE area=? ORDER BY number", (area,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM equipment ORDER BY area, number").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/equipment/<int:eid>', methods=['GET'])
@token_required
def get_equipment_detail(eid):
    conn = get_db()
    eq = conn.execute("SELECT * FROM equipment WHERE id=?", (eid,)).fetchone()
    comps = conn.execute("SELECT * FROM components WHERE equipment_id=?", (eid,)).fetchall()
    logs = conn.execute("SELECT * FROM maintenance_logs WHERE equipment_id=? ORDER BY date DESC LIMIT 10", (eid,)).fetchall()
    conn.close()
    if not eq: return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'equipment': dict(eq), 'components': [dict(c) for c in comps], 'logs': [dict(l) for l in logs]})

@app.route('/api/equipment/<int:eid>', methods=['PUT'])
@token_required
def update_equipment(eid):
    data = request.json
    conn = get_db()
    conn.execute("UPDATE equipment SET status=?, notes=?, last_maintenance=? WHERE id=?",
                 (data.get('status'), data.get('notes'), data.get('last_maintenance'), eid))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Actualizado'})

@app.route('/api/maintenance', methods=['POST'])
@token_required
def add_maintenance():
    data = request.json
    conn = get_db()
    conn.execute("INSERT INTO maintenance_logs (equipment_id, type, description, technician, next_maintenance) VALUES (?,?,?,?,?)",
                 (data['equipment_id'], data.get('type'), data.get('description'), data.get('technician'), data.get('next_maintenance')))
    conn.execute("UPDATE equipment SET last_maintenance=CURRENT_TIMESTAMP, status=? WHERE id=?",
                 (data.get('equipment_status', 'maintenance'), data['equipment_id']))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Registro agregado'})

# ── NUEVOS ENDPOINTS para gestión de logs ──────────────────────────────────

@app.route('/api/maintenance/all', methods=['GET'])
@token_required
def get_all_maintenance():
    """Todos los registros de mantenimiento con info del equipo"""
    conn = get_db()
    rows = conn.execute("""
        SELECT ml.*, e.name as equipment_name, e.area as equipment_area, e.number as equipment_number
        FROM maintenance_logs ml
        JOIN equipment e ON e.id = ml.equipment_id
        ORDER BY ml.date DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/maintenance/<int:lid>', methods=['GET'])
@token_required
def get_maintenance_detail(lid):
    conn = get_db()
    row = conn.execute("""
        SELECT ml.*, e.name as equipment_name, e.area as equipment_area, e.number as equipment_number
        FROM maintenance_logs ml
        JOIN equipment e ON e.id = ml.equipment_id
        WHERE ml.id=?
    """, (lid,)).fetchone()
    conn.close()
    if not row: return jsonify({'error': 'No encontrado'}), 404
    return jsonify(dict(row))

@app.route('/api/maintenance/<int:lid>', methods=['PUT'])
@token_required
def update_maintenance(lid):
    data = request.json
    conn = get_db()
    conn.execute("""UPDATE maintenance_logs SET type=?, description=?, technician=?, next_maintenance=? WHERE id=?""",
                 (data.get('type'), data.get('description'), data.get('technician'), data.get('next_maintenance'), lid))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Actualizado'})

@app.route('/api/maintenance/<int:lid>', methods=['DELETE'])
@token_required
def delete_maintenance(lid):
    conn = get_db()
    conn.execute("DELETE FROM maintenance_logs WHERE id=?", (lid,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Eliminado'})

@app.route('/api/maintenance/<int:lid>/pdf', methods=['GET'])
@token_required
def export_maintenance_pdf(lid):
    """Genera PDF de un registro de mantenimiento en formato IMVET"""
    conn = get_db()
    log = conn.execute("""
        SELECT ml.*, e.name as equipment_name, e.area as equipment_area, e.number as equipment_number,
               e.notes as equipment_notes, e.status as equipment_status
        FROM maintenance_logs ml
        JOIN equipment e ON e.id = ml.equipment_id
        WHERE ml.id=?
    """, (lid,)).fetchone()
    conn.close()
    if not log: return jsonify({'error': 'No encontrado'}), 404

    log = dict(log)

    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import cm, mm
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.5*cm, bottomMargin=1.5*cm)

    from reportlab.platypus import Image as RLImage

    # Colores IMVET
    ROJO = colors.HexColor('#CC0000')
    AZUL = colors.HexColor('#003366')
    GRIS_CLARO = colors.HexColor('#F5F5F5')
    GRIS_BORDE = colors.HexColor('#CCCCCC')

    story = []

    # ── CABECERA con logos reales ─────────────────────────────────────────
    logo_imvet_path = os.path.join(BASE_DIR, 'logo_imvet.png')
    logo_mant_path  = os.path.join(BASE_DIR, 'logo_mantenimiento.png')

    # Celda izquierda: imagen logo IMVET grande
    if os.path.exists(logo_imvet_path):
        logo_left_img = RLImage(logo_imvet_path, width=3.8*cm, height=3.0*cm)
        logo_left_img.hAlign = 'LEFT'
        logo_left_cell = logo_left_img
    else:
        logo_left_cell = Paragraph(
            '<font name="Helvetica-Bold" size="18" color="#CC0000">IMVET</font>',
            ParagraphStyle('logoFallback', leading=20))

    # Celda central: título
    titulo_centro = Paragraph("""
        <font name="Helvetica-Bold" size="13">REGISTRO DE MANTENIMIENTO</font><br/>
        <font name="Helvetica-Bold" size="11">DEPARTAMENTO DE MANTENIMIENTO</font><br/>
        <font name="Helvetica" size="9">IMVET S.R.L.</font>
    """, ParagraphStyle('titulo', alignment=TA_CENTER, leading=16))

    # Celda derecha: escudo Depto. Mantenimiento
    if os.path.exists(logo_mant_path):
        logo_right_img = RLImage(logo_mant_path, width=2.8*cm, height=2.8*cm)
        logo_right_img.hAlign = 'CENTER'
        logo_right_cell = logo_right_img
    else:
        logo_right_cell = Paragraph(
            '<font name="Helvetica-Bold" size="9" color="#003366">DEPTO.<br/>MANT.</font>',
            ParagraphStyle('logoRFallback', alignment=TA_CENTER, leading=12))

    header_table = Table([[logo_left_cell, titulo_centro, logo_right_cell]],
        colWidths=[4.5*cm, 9.5*cm, 4*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
        ('ALIGN', (2,0), (2,0), 'CENTER'),
        ('LINEBELOW', (0,0), (-1,0), 2, ROJO),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (0,0), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))

    # ── DATOS GENERALES ──────────────────────────────────────────────────
    fecha_mant = log.get('date','')[:10] if log.get('date') else '—'
    proxima = log.get('next_maintenance','')[:10] if log.get('next_maintenance') else '—'

    tipo_map = {'preventivo':'Preventivo','correctivo':'Correctivo','predictivo':'Predictivo'}
    tipo_label = tipo_map.get(log.get('type',''), log.get('type','').title())

    def hdr(txt):
        return Paragraph(f'<font name="Helvetica-Bold" size="8">{txt}</font>',
                         ParagraphStyle('h', textColor=colors.white))
    def val(txt):
        return Paragraph(f'<font name="Helvetica" size="9">{txt or "—"}</font>',
                         ParagraphStyle('v'))

    general_data = [
        [hdr('N° REGISTRO'), hdr('FECHA'), hdr('TIPO'), hdr('TÉCNICO RESPONSABLE')],
        [val(f'REG-{str(log["id"]).zfill(4)}'), val(fecha_mant), val(tipo_label), val(log.get('technician','—'))],
        [hdr('EQUIPO / MÁQUINA'), hdr('ÁREA'), hdr('N° EQUIPO'), hdr('PRÓXIMO MANTENIMIENTO')],
        [val(log.get('equipment_name','—')), val(log.get('equipment_area','—')),
         val(f'#{log.get("equipment_number","—")}'), val(proxima)],
    ]
    gen_table = Table(general_data, colWidths=[4*cm, 3.5*cm, 3.5*cm, 7*cm])
    gen_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), AZUL),
        ('BACKGROUND', (0,2), (-1,2), AZUL),
        ('BACKGROUND', (0,1), (-1,1), GRIS_CLARO),
        ('BACKGROUND', (0,3), (-1,3), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, GRIS_BORDE),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(gen_table)
    story.append(Spacer(1, 10))

    # ── DESCRIPCIÓN DEL TRABAJO ──────────────────────────────────────────
    desc_header = Table([[hdr('DESCRIPCIÓN DEL TRABAJO REALIZADO')]],
        colWidths=[18*cm])
    desc_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), AZUL),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(desc_header)

    desc_text = log.get('description') or '—'
    desc_body = Table([[Paragraph(f'<font name="Helvetica" size="10">{desc_text}</font>',
                                   ParagraphStyle('desc', leading=14))]],
        colWidths=[18*cm])
    desc_body.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_BORDE),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('MINROWHEIGHT', (0,0), (-1,-1), 3*cm),
    ]))
    story.append(desc_body)
    story.append(Spacer(1, 10))

    # ── TABLA DE ACTIVIDADES ─────────────────────────────────────────────
    act_header = Table([[hdr('ACTIVIDADES DE MANTENIMIENTO')]],
        colWidths=[18*cm])
    act_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), AZUL),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(act_header)

    def act_h(t): return Paragraph(f'<font name="Helvetica-Bold" size="8" color="#FFFFFF">{t}</font>', ParagraphStyle('ah', textColor=colors.white))
    def act_v(t, c='black'): return Paragraph(f'<font name="Helvetica" size="9" color="{c}">{t}</font>', ParagraphStyle('av'))

    area_tag_map = {
        'TRITURACION': '210', 'MOLIENDA': '220', 'FLOTACION': '240', 'RECIRCULACION': '260'
    }
    tag = area_tag_map.get(log.get('equipment_area',''), '—')

    activities = [
        [act_h('ÍTEM'), act_h('TAG'), act_h('DESCRIPCIÓN / ACTIVIDAD'), act_h('EQUIPO / ÁREA'), act_h('RECURSOS')],
        [act_v('1'), act_v(f'{tag}-{str(log.get("equipment_number","")).zfill(2)}'),
         act_v(desc_text[:80] + ('...' if len(desc_text) > 80 else '')),
         act_v(log.get('equipment_name','—')),
         act_v(log.get('technician','—'))],
    ]
    act_table = Table(activities, colWidths=[1.2*cm, 2.5*cm, 7.3*cm, 4.5*cm, 2.5*cm])
    act_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), AZUL),
        ('GRID', (0,0), (-1,-1), 0.5, GRIS_BORDE),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, GRIS_CLARO]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('MINROWHEIGHT', (0,1), (-1,-1), 1.2*cm),
    ]))
    story.append(act_table)
    story.append(Spacer(1, 16))

    # ── FIRMAS ───────────────────────────────────────────────────────────
    firma_style = ParagraphStyle('firma', alignment=TA_CENTER, fontSize=8, leading=12)

    firmas_data = [
        [
            Paragraph('<font name="Helvetica" size="8">____________________</font>', ParagraphStyle('f', alignment=TA_CENTER)),
            Paragraph('<font name="Helvetica" size="8">____________________</font>', ParagraphStyle('f', alignment=TA_CENTER)),
            Paragraph('<font name="Helvetica" size="8">____________________</font>', ParagraphStyle('f', alignment=TA_CENTER)),
        ],
        [
            Paragraph('<font name="Helvetica-Bold" size="8">J. Carlos Laurean Z.</font>', ParagraphStyle('f', alignment=TA_CENTER)),
            Paragraph('<font name="Helvetica-Bold" size="8">C. Kevin Mamani M.</font>', ParagraphStyle('f', alignment=TA_CENTER)),
            Paragraph('<font name="Helvetica-Bold" size="8">Ing. Javier Chávez</font>', ParagraphStyle('f', alignment=TA_CENTER)),
        ],
        [
            Paragraph('<font name="Helvetica" size="7" color="#555555">Tec. Mecánico</font>', ParagraphStyle('f', alignment=TA_CENTER)),
            Paragraph('<font name="Helvetica" size="7" color="#555555">Tec. Mecánico</font>', ParagraphStyle('f', alignment=TA_CENTER)),
            Paragraph('<font name="Helvetica" size="7" color="#555555">Supdte. de Planta</font>', ParagraphStyle('f', alignment=TA_CENTER)),
        ],
    ]
    firma_table = Table(firmas_data, colWidths=[6*cm, 6*cm, 6*cm])
    firma_table.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LINEABOVE', (0,1), (-1,1), 0.5, colors.black),
    ]))
    story.append(firma_table)
    story.append(Spacer(1, 8))

    # ── PIE ──────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=ROJO))
    story.append(Spacer(1, 4))
    footer_style = ParagraphStyle('foot', alignment=TA_CENTER, fontSize=7, textColor=colors.HexColor('#666666'))
    story.append(Paragraph(
        f'<font name="Helvetica" size="7" color="#666666">LA SEGURIDAD ES IMPORTANTE PARA EL TRABAJADOR — ¡TRABAJAR BIEN ES HACER BUENA SEGURIDAD! | '
        f'Generado: {datetime.datetime.now().strftime("%d/%m/%Y %H:%M")} | IMVET S.R.L.</font>',
        footer_style))

    doc.build(story)
    buf.seek(0)
    fname = f"mantenimiento_REG{str(log['id']).zfill(4)}_{fecha_mant}.pdf"
    return send_file(buf, mimetype='application/pdf', as_attachment=True, download_name=fname)

@app.route('/api/stats', methods=['GET'])
@token_required
def get_stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) as c FROM equipment").fetchone()['c']
    operational = conn.execute("SELECT COUNT(*) as c FROM equipment WHERE status='operational'").fetchone()['c']
    maintenance = conn.execute("SELECT COUNT(*) as c FROM equipment WHERE status='maintenance'").fetchone()['c']
    critical = conn.execute("SELECT COUNT(*) as c FROM equipment WHERE status='critical'").fetchone()['c']
    by_area = conn.execute("SELECT area, COUNT(*) as count FROM equipment GROUP BY area").fetchall()
    conn.close()
    return jsonify({'total': total, 'operational': operational, 'maintenance': maintenance, 'critical': critical,
                    'by_area': [dict(r) for r in by_area]})

@app.route('/api/components/<int:eid>', methods=['GET'])
@token_required
def get_components(eid):
    conn = get_db()
    comps = conn.execute("SELECT * FROM components WHERE equipment_id=? ORDER BY category", (eid,)).fetchall()
    conn.close()
    grouped = {}
    for c in comps:
        d = dict(c)
        cat = d['category']
        if cat not in grouped: grouped[cat] = []
        grouped[cat].append(d)
    return jsonify(grouped)
init_db()
@app.route('/api/setup', methods=['GET'])
def setup():
    init_db()
    return jsonify({"message": "DB inicializada correctamente"})
if __name__ == '__main__':
    
    print("🚀 IMVET Mining System API → http://localhost:5000")
    app.run(debug=False, port=5000)