<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Liste des employés</title>
    <style>
        body { font-family: DeJaVu Sans, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4B42C8; color: white; }
        .header { text-align: center; margin-bottom: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Liste des employés - {{ $annee }}</h2>
        <p>Généré le: {{ $date }}</p>
        <p>Total: {{ $total }} employés</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nom complet</th>
                <th>Email</th>
                <th>Département</th>
                <th>Poste</th>
                <th>Grade</th>
                <th>Échelle</th>
                <th>Échelon</th>
                <th>Salaire</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employees as $emp)
            <tr>
                <td>{{ $emp->id }}</td>
                <td>{{ $emp->prenom }} {{ $emp->nom }}</td>
                <td>{{ $emp->email }}</td>
                <td>{{ $emp->departement ?? '-' }}</td>
                <td>{{ $emp->poste ?? '-' }}</td>
                <td>{{ $emp->grade ?? '-' }}</td>
                <td>{{ $emp->echelle ?? '-' }}</td>
                <td>{{ $emp->echelon ?? '-' }}</td>
                <td>{{ number_format($emp->salaire ?? 0, 2) }} MAD</td>
                <td>{{ $emp->statut }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>