<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Liste des employés - {{ $annee }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: 'DeJaVu Sans', 'Segoe UI', Arial, sans-serif; 
            font-size: 10px;
            padding: 20px;
            background: #fff;
        }
        
        /* En-tête */
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #4B42C8;
        }
        
        .header h2 {
            color: #4B42C8;
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .header p {
            color: #666;
            font-size: 10px;
            margin: 3px 0;
        }
        
        .total-badge {
            display: inline-block;
            background: #4B42C8;
            color: white;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 10px;
            margin-top: 5px;
        }
        
        /* Tableau */
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
            font-size: 9px;
        }
        
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px 6px; 
            text-align: left; 
        }
        
        th { 
            background: linear-gradient(135deg, #4B42C8 0%, #6366f1 100%);
            color: white; 
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        tr:hover {
            background-color: #f3f4f6;
        }
        
        td {
            color: #374151;
        }
        
        /* Statut badges */
        .badge-actif {
            background: #10b981;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8px;
            font-weight: bold;
            display: inline-block;
        }
        
        .badge-conge {
            background: #f59e0b;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8px;
            font-weight: bold;
            display: inline-block;
        }
        
        .badge-depart {
            background: #ef4444;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8px;
            font-weight: bold;
            display: inline-block;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 9px;
            color: #999;
        }
        
        /* Sections d'information */
        .info-section {
            margin: 15px 0;
            padding: 10px;
            background: #f8fafc;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
        }
        
        .info-card {
            text-align: center;
            flex: 1;
            padding: 8px;
        }
        
        .info-card .label {
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-card .value {
            font-size: 14px;
            font-weight: bold;
            color: #4B42C8;
        }
        
        /* Masse salariale */
        .salary-summary {
            background: linear-gradient(135deg, #4B42C8 0%, #6366f1 100%);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 15px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .salary-summary .label {
            font-size: 10px;
            opacity: 0.9;
        }
        
        .salary-summary .value {
            font-size: 16px;
            font-weight: bold;
        }
        
        /* Watermark */
        .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            opacity: 0.1;
            font-size: 40px;
            font-weight: bold;
            color: #4B42C8;
            transform: rotate(-15deg);
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="watermark">OptizaRH</div>
    
    <div class="header">
        <h2>📋 Liste des employés</h2>
        <p>Année: <strong>{{ $annee }}</strong></p>
        <p>Date d'édition: {{ $date }}</p>
        <span class="total-badge">Total: {{ $total }} employés</span>
    </div>
    
    <!-- Section des statistiques -->
    <div class="info-section">
        <div class="info-card">
            <div class="label">👥 Actifs</div>
            <div class="value">{{ $actifs ?? 0 }}</div>
        </div>
        <div class="info-card">
            <div class="label">😴 Congé</div>
            <div class="value">{{ $conges ?? 0 }}</div>
        </div>
        <div class="info-card">
            <div class="label">🚪 Départs</div>
            <div class="value">{{ $departs ?? 0 }}</div>
        </div>
        <div class="info-card">
            <div class="label">📊 Grades</div>
            <div class="value">{{ $gradesCount ?? 0 }}</div>
        </div>
    </div>
    
    <!-- Masse salariale -->
    <div class="salary-summary">
        <span class="label">💰 Masse salariale totale</span>
        <span class="value">{{ number_format($totalSalaires ?? 0, 2) }} MAD</span>
    </div>
    
    <!-- Tableau des employés -->
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Nom complet</th>
                <th>Email</th>
                <th>Département</th>
                <th>Poste</th>
                <th>Grade</th>
                <th>Échelon</th>
                <th>Salaire (MAD)</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employees as $index => $emp)
            <tr>
                <td>{{ $emp->id }}</td>
                <td><strong>{{ $emp->prenom }} {{ $emp->nom }}</strong></td>
                <td>{{ $emp->email }}</td>
                <td>{{ $emp->departement ?? '-' }}</td>
                <td>{{ $emp->poste ?? '-' }}</td>
                <td>{{ $emp->grade ?? '-' }}</td>
                <td>{{ $emp->echelon ?? '-' }}</td>
                <td style="text-align: right;">{{ number_format($emp->salaire ?? 0, 2) }}</td>
                <td>
                    @if($emp->statut === 'ACTIF')
                        <span class="badge-actif">ACTIF</span>
                    @elseif($emp->statut === 'CONGÉ')
                        <span class="badge-conge">CONGÉ</span>
                    @else
                        <span class="badge-depart">DÉPART</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <!-- Récapitulatif par grade -->
    @if(isset($gradesSummary) && count($gradesSummary) > 0)
    <div style="margin-top: 20px;">
        <h3 style="color: #4B42C8; font-size: 11px; margin-bottom: 8px;">📊 Récapitulatif par grade</h3>
        <table style="width: auto; margin: 0;">
            <thead>
                <tr>
                    <th>Grade</th>
                    <th>Effectif</th>
                    <th>Masse salariale (MAD)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($gradesSummary as $grade)
                <tr>
                    <td>{{ $grade['name'] }}</td>
                    <td style="text-align: center;">{{ $grade['count'] }}</td>
                    <td style="text-align: right;">{{ number_format($grade['total'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
    
    <div class="footer">
        <p>Document généré par OptizaRH System</p>
        <p>Ce document est confidentiel et ne doit pas être distribué sans autorisation</p>
    </div>
</body>
</html>