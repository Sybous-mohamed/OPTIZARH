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
    
    <!-- Tableau des employés -->
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Nom complet</th>
                <th>Email</th>
                <th>Poste</th>
                <th>Grade</th>
                <th>Salaire (MAD)</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employees as $index => $emp)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td><strong>{{ $emp->prenom }} {{ $emp->nom }}</strong></td>
                <td>{{ $emp->email }}</td>
                <td>{{ $emp->post->name ?? $emp->grade ?? '-' }}</td>
                <td>{{ $emp->grade ?? '-' }}</td>
                <td style="text-align: right;">{{ number_format($emp->salaire ?? 0, 2) }}</td>
                <td>
                    @if($emp->statut === 'ACTIF')
                        <span class="badge-actif">ACTIF</span>
                    @elseif($emp->statut === 'CONGE')
                        <span class="badge-conge">CONGÉ</span>
                    @else
                        <span class="badge-depart">DÉPART</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="footer">
        <p>Document généré par OptizaRH System</p>
        <p>Ce document est confidentiel et ne doit pas être distribué sans autorisation</p>
    </div>
</body>
</html>