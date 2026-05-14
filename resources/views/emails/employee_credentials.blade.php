<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Vos identifiants</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue sur le Portail RH</h1>
        </div>
        
        <div style="padding: 24px;">
            <p style="font-size: 16px; color: #333;">Bonjour <strong>{{ $name }}</strong>,</p>
            
            @if(isset($isUpdate) && $isUpdate)
                <p style="font-size: 14px; color: #555; margin-top: 16px;">
                    Votre mot de passe a été réinitialisé. Voici vos nouveaux identifiants :
                </p>
            @else
                <p style="font-size: 14px; color: #555; margin-top: 16px;">
                    Votre compte a été créé avec succès. Voici vos identifiants pour vous connecter :
                </p>
            @endif
            
            <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong style="color: #4F46E5;">Email :</strong> {{ $email }}</p>
                <p style="margin: 8px 0;"><strong style="color: #4F46E5;">Mot de passe :</strong> <code style="background: white; padding: 4px 8px; border-radius: 6px;">{{ $password }}</code></p>
            </div>
            
            <p style="font-size: 14px; color: #555;">
                🔐 <strong>Important :</strong> Lors de votre première connexion, vous serez invité à changer votre mot de passe.
            </p>
            
            <a href="{{ $loginUrl }}" style="display: block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; text-align: center; padding: 12px; border-radius: 8px; text-decoration: none; margin-top: 24px; font-weight: bold;">
                🔑 Se connecter
            </a>
            
            <p style="font-size: 12px; color: #999; margin-top: 24px; text-align: center;">
                © {{ $year ?? date('Y') }} Plateforme RH - Tous droits réservés
            </p>
        </div>
    </div>
</body>
</html>