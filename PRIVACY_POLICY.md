# Datenschutzerklärung für Encrypted Notes

**Letzte Aktualisierung: 28. Dezember 2025**

## 1. Einleitung

Diese Datenschutzerklärung beschreibt, wie die App "Encrypted Notes" (im Folgenden "die App") mit Ihren Daten umgeht. Der Schutz Ihrer Privatsphäre ist uns sehr wichtig.

## 2. Verantwortlicher

[Ihr Name/Firmenname]
[Ihre Adresse]
[Ihre E-Mail-Adresse]

## 3. Grundsatz: Keine Datensammlung

**Encrypted Notes ist eine vollständig offline arbeitende App. Wir sammeln, übertragen oder speichern keinerlei persönliche Daten auf externen Servern.**

Alle Ihre Daten verbleiben ausschließlich auf Ihrem Gerät und werden niemals an uns oder Dritte übertragen.

## 4. Lokale Datenspeicherung

### 4.1 Notizen und Inhalte
- Alle Notizen werden lokal auf Ihrem Gerät in einer verschlüsselten SQLite-Datenbank gespeichert
- Die Verschlüsselung erfolgt mit ChaCha20-Poly1305 und Scrypt-Key-Derivation
- Ihre Notizen verlassen niemals Ihr Gerät, außer Sie exportieren diese manuell

### 4.2 Medienanhänge
- Bilder, Audio-Aufnahmen und andere Anhänge werden lokal im App-Speicher Ihres Geräts gespeichert
- Diese Dateien werden verschlüsselt gespeichert, wenn die Notiz mit einem Passwort geschützt ist
- Kein Upload oder externe Übertragung findet statt

### 4.3 Backups
- Backups werden lokal auf Ihrem Gerät erstellt
- Sie haben die volle Kontrolle über Export und Import von Backups
- Backups enthalten Ihre Notizen und Anhänge im JSON-Format
- Verschlüsselte Notizen bleiben auch im Backup verschlüsselt

## 5. Berechtigungen

Die App benötigt folgende Berechtigungen:

### 5.1 Speicher- und Medienzugriff
- **READ_MEDIA_IMAGES**: Zum Anhängen von Bildern aus Ihrer Galerie an Notizen
- **READ_MEDIA_AUDIO**: Zum Anhängen von Audio-Dateien an Notizen
- **RECORD_AUDIO**: Zum Erstellen von Sprachaufnahmen direkt in der App

**Wichtig**: Diese Berechtigungen werden ausschließlich verwendet, um von Ihnen ausgewählte Medien zu Ihren Notizen hinzuzufügen. Es erfolgt kein automatischer Zugriff auf Ihre Medien oder eine Übertragung an externe Server.

## 6. Keine externe Datenübertragung

Die App:
- Sendet keine Daten an externe Server
- Kontaktiert keine APIs oder Webdienste
- Enthält keine Tracking- oder Analytics-Software
- Enthält keine Werbung
- Nutzt keine Cloud-Dienste
- Teilt keine Daten mit Dritten

## 7. Verschlüsselung und Sicherheit

- Notizen können mit einem Passwort geschützt werden
- Die Verschlüsselung erfolgt mit modernen kryptographischen Algorithmen:
  - ChaCha20-Poly1305 für symmetrische Verschlüsselung
  - Scrypt für Passwort-basierte Schlüsselableitung
- Verschlüsselte Notizen können nur mit dem korrekten Passwort gelesen werden
- Das Passwort wird nicht gespeichert - wenn Sie es vergessen, können die Notizen nicht wiederhergestellt werden

## 8. Datenweitergabe

Da keine Daten gesammelt oder übertragen werden, findet auch keine Weitergabe an Dritte statt.

## 9. Ihre Rechte

Da wir keine personenbezogenen Daten sammeln oder verarbeiten, entstehen keine DSGVO-relevanten Verpflichtungen bezüglich:
- Auskunftsrecht
- Recht auf Berichtigung
- Recht auf Löschung
- Recht auf Datenübertragbarkeit

Sie haben jederzeit die volle Kontrolle über Ihre Daten:
- Alle Daten befinden sich ausschließlich auf Ihrem Gerät
- Sie können die App jederzeit deinstallieren, wodurch alle lokalen Daten gelöscht werden
- Sie können einzelne Notizen jederzeit löschen
- Sie können Backups erstellen und diese nach eigenem Ermessen aufbewahren oder löschen

## 10. Datensicherheit

Die Sicherheit Ihrer Daten liegt in Ihrer Verantwortung:
- Schützen Sie Ihr Gerät mit einem sicheren Sperrbildschirm
- Verwenden Sie starke Passwörter für verschlüsselte Notizen
- Erstellen Sie regelmäßig Backups und bewahren Sie diese sicher auf
- Bei Geräteverlust sind nur passwortgeschützte Notizen vor Zugriff geschützt

## 11. Kinder

Die App richtet sich an alle Altersgruppen. Da keine Daten gesammelt werden, bestehen keine besonderen Anforderungen bezüglich der Nutzung durch Minderjährige.

## 12. Änderungen dieser Datenschutzerklärung

Wir behalten uns vor, diese Datenschutzerklärung zu aktualisieren. Änderungen werden über App-Updates kommuniziert. Die jeweils aktuelle Version finden Sie unter:
https://github.com/[IhrUsername]/encrypted-notes/blob/master/PRIVACY_POLICY.md

## 13. Kontakt

Bei Fragen zum Datenschutz können Sie uns kontaktieren:

[Ihre E-Mail-Adresse]

---

## Zusammenfassung

**Encrypted Notes ist eine datenschutzfreundliche App, die vollständig offline arbeitet:**

- Keine Datensammlung
- Keine Server-Kommunikation
- Keine Drittanbieter-Dienste
- Keine Analytics oder Tracking
- Keine Werbung
- Alle Daten bleiben lokal auf Ihrem Gerät
- End-to-End-Verschlüsselung für geschützte Notizen
- Sie haben die volle Kontrolle über Ihre Daten

Ihre Privatsphäre ist vollständig geschützt.
