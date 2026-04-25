<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Grille Salariale {{ $year }} - OptizaRH</title>
    <style>
        @page { margin: 1cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #334155;
            background: white;
        }

        /* Header Professionnel */
        .header {
            margin-bottom: 30px;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 15px;
        }
        .header-top { display: table; width: 100%; }
        .logo-area { display: table-cell; width: 50%; vertical-align: middle; }
        .meta-area { display: table-cell; width: 50%; text-align: right; vertical-align: middle; }
        
        .project-name { font-size: 18px; font-weight: bold; color: #4f46e5; letter-spacing: -0.5px; }
        .doc-title { font-size: 14px; color: #1e293b; font-weight: bold; margin-top: 5px; }
        .meta-text { color: #64748b; font-size: 8px; }

        /* Summary Stats */
        .stats-grid {
            width: 100%;
            margin-bottom: 25px;
            border-collapse: separate;
            border-spacing: 10px 0;
        }
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-label { font-size: 7px; color: #64748b; text-transform: uppercase; font-weight: bold; }
        .stat-value { font-size: 14px; font-weight: bold; color: #4f46e5; }

        /* Styles des Tableaux */
        .role-section { margin-bottom: 40px; page-break-inside: avoid; }
        .role-header {
            background: #4f46e5;
            color: white;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 6px 6px 0 0;
        }

        table { width: 100%; border-collapse: collapse; margin-top: -1px; }
        th {
            background: #f1f5f9;
            color: #475569;
            text-align: left;
            padding: 8px;
            font-size: 8px;
            text-transform: uppercase;
            border: 1px solid #e2e8f0;
        }
        td {
            padding: 7px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }

        .grade-row { background: #f8fafc; font-weight: bold; color: #1e293b; }
        .echelle-badge {
            background: #eef2ff;
            color: #4338ca;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
        .salary-val { font-weight: bold; color: #059669; text-align: right; }

        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 7px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-top">
            <div class="logo-area">
                <div class="project-name">OPTIZA RH</div>
                <div class="doc-title">GRILLE SALARIALE {{ $year }}</div>
            </div>
            <div class="meta-area">
                <div class="meta-text">Référence: PDF-GS-{{ $year }}-{{ date('dmy') }}</div>
                <div class="meta-text">Date d'édition: {{ $date }}</div>
            </div>
        </div>
    </div>

    @if(count($data->roles) > 0)
        <table class="stats-grid">
            <tr>
                <td class="stat-card">
                    <div class="stat-label">Total Rôles</div>
                    <div class="stat-value">{{ count($data->roles) }}</div>
                </td>
                <td class="stat-card">
                    <div class="stat-label">Total Grades</div>
                    <div class="stat-value">{{ $data->roles->sum(function($r){ return $r->grades->count(); }) }}</div>
                </td>
                <td class="stat-card">
                    <div class="stat-label">Masse Salariale Moy.</div>
                    <div class="stat-value">{{ number_format($data->roles->avg(function($r){ return $r->grades->avg(function($g){ return $g->echelles->avg(function($e){ return $e->echelons->avg('salary'); }); }); }), 0, ',', ' ') }} <small>MAD</small></div>
                </td>
            </tr>
        </table>

        @foreach($data->roles as $role)
            <div class="role-section">
                <div class="role-header">🏢 RÔLE : {{ strtoupper($role->name) }}</div>
                <table>
                    <thead>
                        <tr>
                            <th width="30%">Grade</th>
                            <th width="15%">Échelle</th>
                            <th width="15%">Échelon</th>
                            <th width="15%">Indice</th>
                            <th width="25%">Salaire de Base (MAD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($role->grades as $grade)
                            @foreach($grade->echelles as $echelle)
                                @foreach($echelle->echelons as $echelon)
                                    <tr>
                                        @if($loop->parent->first && $loop->first)
                                            <td rowspan="{{ $grade->echelles->sum(function($e){ return $e->echelons->count(); }) }}" class="grade-row">
                                                {{ $grade->name }}
                                            </td>
                                        @endif
                                        
                                        @if($loop->first)
                                            <td rowspan="{{ $echelle->echelons->count() }}" style="text-align: center;">
                                                <span class="echelle-badge">Niv. {{ $echelle->level }}</span>
                                            </td>
                                        @endif

                                        <td style="text-align: center; color: #64748b;">E{{ $echelon->order }}</td>
                                        <td style="text-align: center;">{{ $echelon->index_val }}</td>
                                        <td class="salary-val">{{ number_format($echelon->salary, 2, ',', ' ') }}</td>
                                    </tr>
                                @endforeach
                            @endforeach
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endforeach
    @else
        <div style="text-align: center; padding: 50px; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 12px;">
            <p style="font-size: 14px;">⚠️ Aucune donnée disponible pour l'année {{ $year }}</p>
        </div>
    @endif

    <div class="footer">
        Document généré par OptizaRH Système - Page 1/1 - Confidentiel
    </div>
</body>
</html>