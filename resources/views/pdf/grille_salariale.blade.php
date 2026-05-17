<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Grille Salariale {{ $year }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Grille Salariale - Année {{ $year }}</h1>
        <p>Date d'export : {{ $date }}</p>
    </div>

    @forelse($data->Post as $post)
        <h2>Poste : {{ $post['name'] }}</h2>
        @foreach($post['grades'] as $grade)
            <h3>Grade : {{ $grade['name'] }}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Échelle</th>
                        <th>Échelon</th>
                        <th>Indice</th>
                        <th>Salaire (MAD)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($grade['echelles'] as $echelle)
                        @foreach($echelle['echelons'] as $echelon)
                            <tr>
                                <td>{{ $echelle['level'] }}</td>
                                <td>{{ $echelon['order'] }}</td>
                                <td>{{ $echelon['index_val'] }}</td>
                                <td>{{ number_format($echelon['salary'], 2) }}</td>
                            </tr>
                        @endforeach
                    @endforeach
                </tbody>
            </table>
        @endforeach
        @if(!$loop->last)
            <div class="page-break"></div>
        @endif
    @empty
        <p>Aucune configuration trouvée pour l'année {{ $year }}</p>
    @endforelse
</body>
</html>