<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Barème IR {{ $annee }}</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #334155; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
        .title { font-size: 18px; font-weight: bold; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #f8fafc; color: #64748b; padding: 10px; border: 1px solid #e2e8f0; text-transform: uppercase; font-size: 9px; }
        td { padding: 10px; border: 1px solid #e2e8f0; text-align: center; }
        .highlight { color: #10b981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Paramétrage de l'Impôt sur le Revenu (IR)</div>
        <p>Annee Fiscal : <strong>{{ $annee }}</strong></p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Min (DH)</th>
                <th>Max (DH)</th>
                <th>Taux (%)</th>
                <th>Marié</th>
                <th>Enfant 1</th>
                <th>Enfant 2</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
            <tr>
                <td>{{ number_format($row['min'], 2) }}</td>
                <td>{{ number_format($row['max'], 2) }}</td>
                <td>{{ $row['taux'] }}%</td>
                <td class="highlight">{{ $row['marie'] }}</td>
                <td class="highlight">{{ $row['enfant1'] }}</td>
                <td class="highlight">{{ $row['enfant2'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>