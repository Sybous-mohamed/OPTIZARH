<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Liste Employés</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #4B42C8; color: white; }
        .header { text-align: center; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Liste des Employés</h1>
        <p>Généré le: {{ date('d/m/Y H:i') }}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Nom & Prénom</th>
                <th>Email</th>
                <th>Poste</th>
                <th>Département</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employees as $emp)
            <tr>
                <td>{{ $emp['prenom'] }} {{ $emp['nom'] }}</td>
                <td>{{ $emp['email'] }}</td>
                <td>{{ $emp['poste'] ?? 'N/A' }}</td>
                <td>{{ $emp['departement'] ?? 'N/A' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>