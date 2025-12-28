import { LanguageCode } from '@/src/stores/useLanguageStore';

const rawEntries = {
  'common.cancel': { de: 'Abbrechen', en: 'Cancel', ru: 'Отмена' },
  'common.save': { de: 'Speichern', en: 'Save', ru: 'Сохранить' },
  'common.delete': { de: 'Löschen', en: 'Delete', ru: 'Удалить' },
  'common.close': { de: 'Schließen', en: 'Close', ru: 'Закрыть' },
  'common.ok': { de: 'OK', en: 'OK', ru: 'ОК' },
  'common.unlock': { de: 'Entsperren', en: 'Unlock', ru: 'Разблокировать' },
  'common.password': { de: 'Passwort', en: 'Password', ru: 'Пароль' },
  'common.searchPlaceholder': { de: 'Suchen...', en: 'Search...', ru: 'Поиск...' },
  'common.all': { de: 'Alle', en: 'All', ru: 'Все' },
  'pin.errorInvalid': { de: 'Falscher PIN', en: 'Incorrect PIN', ru: 'Неверный PIN-код' },
  'pin.prompt': { de: 'PIN eingeben', en: 'Enter PIN', ru: 'Введите PIN-код' },
  'notes.card.lockedPreview': { de: 'Gesperrte Notiz - PIN notwendig', en: 'Locked note - PIN required', ru: 'Заблокированная заметка — требуется PIN' },
  'notes.card.untitled': { de: 'Ohne Titel', en: 'Untitled', ru: 'Без названия' },
  'notes.card.badges.locked': { de: 'GESCHÜTZT', en: 'LOCKED', ru: 'ЗАБЛОК.' },
  'notes.card.badges.pinned': { de: 'ANGEHEFTET', en: 'PINNED', ru: 'ЗАКРЕПЛЕНО' },
  'notes.list.emptyTitle': { de: 'Noch keine Notizen', en: 'No notes yet', ru: 'Пока нет заметок' },
  'notes.list.emptySubtitle': { de: 'Tippe auf + um loszulegen', en: 'Tap + to start', ru: 'Нажмите +, чтобы начать' },
  'tabs.notes': { de: 'Notizen', en: 'Notes', ru: 'Заметки' },
  'tabs.settings': { de: 'Einstellungen', en: 'Settings', ru: 'Настройки' },
  'note.unlock.error': { de: 'Falsches Passwort', en: 'Incorrect password', ru: 'Неверный пароль' },
  'note.unlock.title': { de: 'Passwort erforderlich', en: 'Password required', ru: 'Требуется пароль' },
  'noteComposer.titleMissing': { de: 'Titel fehlt', en: 'Title missing', ru: 'Укажите заголовок' },
  'noteComposer.titlePlaceholder': { de: 'Titel', en: 'Title', ru: 'Заголовок' },
  'noteComposer.screen.editTitle': { de: 'Notiz bearbeiten', en: 'Edit note', ru: 'Редактирование заметки' },
  'noteComposer.screen.newTitle': { de: 'Neue Notiz', en: 'New note', ru: 'Новая заметка' },
  'noteComposer.meta.pinned': { de: 'Fixiert', en: 'Pinned', ru: 'Закреплено' },
  'noteComposer.meta.lock': { de: 'Verschlüsseln', en: 'Encrypt', ru: 'Шифр.' },
  'noteComposer.sections.content.title': { de: 'Inhalt', en: 'Content', ru: 'Содержание' },
  'noteComposer.sections.content.subtitle': { de: 'Formatierter Editor mit Toolbar', en: 'Rich editor with toolbar', ru: 'Редактор с панелью инструментов' },
  'noteComposer.sections.checklist.title': { de: 'Checklisten', en: 'Checklists', ru: 'Чек-листы' },
  'noteComposer.sections.checklist.subtitle': { de: 'Plane Aufgaben direkt hier', en: 'Plan tasks right here', ru: 'Планируйте задачи прямо здесь' },
  'noteComposer.sections.checklist.addButton': { de: 'Aufgabe', en: 'Task', ru: 'Задача' },
  'noteComposer.sections.checklist.empty': { de: 'Keine Checklistenpunkte vorhanden.', en: 'No checklist items yet.', ru: 'Пунктов чек-листа пока нет.' },
  'noteComposer.sections.links.title': { de: 'Links', en: 'Links', ru: 'Ссылки' },
  'noteComposer.sections.links.subtitle': { de: 'Speichere wichtige Verknüpfungen', en: 'Save important links', ru: 'Сохраняйте важные ссылки' },
  'noteComposer.sections.links.addButton': { de: 'Link', en: 'Link', ru: 'Ссылка' },
  'noteComposer.sections.links.descriptionPlaceholder': { de: 'Beschreibung', en: 'Description', ru: 'Описание' },
  'noteComposer.sections.links.urlPlaceholder': { de: 'https://beispiel.de', en: 'https://example.com', ru: 'https://primer.ru' },
  'noteComposer.sections.links.empty': { de: 'Noch keine Links hinzugefügt.', en: 'No links added yet.', ru: 'Ссылок пока нет.' },
  'noteComposer.links.defaultDescription': { de: 'Neuer Link', en: 'New link', ru: 'Новая ссылка' },
  'noteComposer.links.openHint': { de: 'Link im Browser öffnen', en: 'Open link in browser', ru: 'Открыть ссылку в браузере' },
  'noteComposer.links.openErrorTitle': { de: 'Link kann nicht geöffnet werden', en: 'Cannot open link', ru: 'Не удалось открыть ссылку' },
  'noteComposer.links.openMissingUrl': { de: 'Bitte gib zuerst eine URL ein.', en: 'Please enter a URL first.', ru: 'Сначала введите адрес ссылки.' },
  'noteComposer.links.openUnsupported': { de: 'Dieser Link-Typ wird auf diesem Gerät nicht unterstützt.', en: 'This type of link is not supported on this device.', ru: 'Этот тип ссылки не поддерживается на устройстве.' },
  'noteComposer.sections.attachments.title': { de: 'Anhänge', en: 'Attachments', ru: 'Вложения' },
  'noteComposer.sections.attachments.empty': { de: 'Noch keine Anhänge gespeichert.', en: 'No attachments yet.', ru: 'Вложения ещё не добавлены.' },
  'noteComposer.sections.tags.title': { de: 'Tags', en: 'Tags', ru: 'Теги' },
  'noteComposer.sections.tags.subtitle': { de: 'Komma getrennt', en: 'Comma separated', ru: 'Через запятую' },
  'noteComposer.sections.tags.placeholder': { de: 'z. B. Arbeit, Ideen, Fokus', en: 'e.g. Work, Ideas, Focus', ru: 'например: Работа, Идеи, Фокус' },
  'noteComposer.sections.tags.empty': { de: 'Noch keine Tags hinzugefügt.', en: 'No tags yet.', ru: 'Теги пока не добавлены.' },
  'noteComposer.checklist.newItem': { de: 'Neue Aufgabe', en: 'New task', ru: 'Новая задача' },
  'noteComposer.lock.errorLength': { de: 'Mindestens 6 Zeichen.', en: 'At least 6 characters.', ru: 'Не менее 6 символов.' },
  'noteComposer.lock.errorMismatch': { de: 'Passwörter stimmen nicht überein.', en: 'Passwords do not match.', ru: 'Пароли не совпадают.' },
  'noteComposer.lock.setPasswordPrompt': { de: 'Passwort setzen', en: 'Set a password', ru: 'Задать пароль' },
  'noteComposer.lock.encryptedHtml': { de: '<p>🔒 Geschützte Notiz</p>', en: '<p>🔒 Protected note</p>', ru: '<p>🔒 Защищённая заметка</p>' },
  'noteComposer.lock.encryptedPreview': { de: 'Gesperrte Notiz - Passwort erforderlich', en: 'Locked note - password required', ru: 'Заблокированная заметка — требуется пароль' },
  'noteComposer.lock.attachmentEncryptionFailed': {
    de: 'Anhänge konnten nicht verschlüsselt werden.',
    en: 'Attachments could not be secured.',
    ru: 'Не удалось защитить вложения.',
  },
  'noteComposer.status.saved': { de: 'Gespeichert', en: 'Saved', ru: 'Сохранено' },
  'noteComposer.error.saveFailed': { de: 'Fehler beim Speichern', en: 'Save failed', ru: 'Не удалось сохранить' },
  'noteComposer.delete.title': { de: 'Notiz löschen?', en: 'Delete note?', ru: 'Удалить заметку?' },
  'noteComposer.delete.message': { de: 'Dieser Schritt kann nicht rückgängig gemacht werden.', en: 'This action cannot be undone.', ru: 'Действие нельзя отменить.' },
  'noteComposer.attachmentMenu.titleFallback': { de: 'Anhang', en: 'Attachment', ru: 'Вложение' },
  'noteComposer.attachmentMenu.export': { de: 'Kopie / Export', en: 'Copy / Export', ru: 'Копия / экспорт' },
  'noteComposer.attachmentMenu.share': { de: 'Teilen', en: 'Share', ru: 'Поделиться' },
  'noteComposer.quickActions.image': { de: 'Bild', en: 'Photo', ru: 'Фото' },
  'noteComposer.quickActions.video': { de: 'Video', en: 'Video', ru: 'Видео' },
  'noteComposer.quickActions.audio': { de: 'Audio', en: 'Audio', ru: 'Аудио' },
  'noteComposer.quickActions.stop': { de: 'Stopp', en: 'Stop', ru: 'Стоп' },
  'noteComposer.actions.image.title': { de: 'Bild hinzufügen', en: 'Add image', ru: 'Добавить изображение' },
  'noteComposer.actions.image.message': { de: 'Wähle die Quelle für dein Bild.', en: 'Select the source for your image.', ru: 'Выберите источник изображения.' },
  'noteComposer.actions.gallery': { de: 'Galerie', en: 'Gallery', ru: 'Галерея' },
  'noteComposer.actions.camera': { de: 'Kamera', en: 'Camera', ru: 'Камера' },
  'noteComposer.actions.imageLoadError': { de: 'Bild konnte nicht geladen werden', en: 'Image could not be loaded', ru: 'Не удалось загрузить изображение' },
  'noteComposer.actions.audio.title': { de: 'Audio hinzufügen', en: 'Add audio', ru: 'Добавить аудио' },
  'noteComposer.actions.audio.message': { de: 'Möglichkeit auswählen', en: 'Choose an option', ru: 'Выберите вариант' },
  'noteComposer.actions.audioPick': { de: 'Datei wählen', en: 'Choose file', ru: 'Выбрать файл' },
  'noteComposer.actions.audioRecord': { de: 'Audio aufnehmen', en: 'Record audio', ru: 'Записать звук' },
  'noteComposer.actions.audioLoadError': { de: 'Audio konnte nicht geladen werden', en: 'Audio could not be loaded', ru: 'Не удалось загрузить аудио' },
  'noteComposer.actions.video.title': { de: 'Video hinzufügen', en: 'Add video', ru: 'Добавить видео' },
  'noteComposer.actions.video.message': { de: 'Quelle wählen', en: 'Choose a source', ru: 'Выберите источник' },
  'noteComposer.actions.videoGallery': { de: 'Aus Galerie', en: 'From library', ru: 'Из галереи' },
  'noteComposer.actions.videoRecord': { de: 'Video aufnehmen', en: 'Record video', ru: 'Записать видео' },
  'noteComposer.actions.videoLoadError': { de: 'Video konnte nicht geladen werden', en: 'Video could not be loaded', ru: 'Не удалось загрузить видео' },
  'noteComposer.media.captureUnavailable': { de: 'Aufnahme nicht möglich', en: 'Capture not available', ru: 'Запись недоступна' },
  'noteComposer.audio.startError': { de: 'Audio kann nicht gestartet werden', en: 'Audio could not start', ru: 'Не удалось запустить аудио' },
  'noteComposer.audio.playbackError': { de: 'Audio konnte nicht abgespielt werden', en: 'Audio could not play', ru: 'Не удалось воспроизвести аудио' },
  'noteComposer.audio.recordingSaveError': { de: 'Aufnahme konnte nicht gespeichert werden', en: 'Recording could not be saved', ru: 'Не удалось сохранить запись' },
  'noteComposer.audio.nowPlaying': { de: 'Wiedergabe läuft', en: 'Now playing', ru: 'Сейчас играет' },
  'noteComposer.saveButton.saving': { de: 'Speichern...', en: 'Saving...', ru: 'Сохранение...' },
  'noteComposer.lock.promptTitle': { de: 'Passwort festlegen', en: 'Set password', ru: 'Установить пароль' },
  'noteComposer.lock.promptHint': { de: 'Mindestens 8 Zeichen, Groß-/Kleinschreibung, Zahlen & Sonderzeichen empfohlen.', en: 'At least 8 characters; mix case, digits & symbols recommended.', ru: 'Минимум 8 символов; используйте буквы разного регистра, цифры и символы.' },
  'noteComposer.lock.confirmPlaceholder': { de: 'Passwort bestätigen', en: 'Confirm password', ru: 'Подтвердите пароль' },
  'noteComposer.lock.warningTitle': { de: 'Hinweis zur Verschlüsselung', en: 'Encryption tip', ru: '????? ?? ??????????' },
  'noteComposer.lock.warningBody': { de: 'Wir empfehlen, verschlüsselte Notizen mit höchstens 50 MB Anhängen zu speichern, um lange Ver- und Entschlüsselungszeiten zu vermeiden.', en: 'We recommend keeping encrypted notes under roughly 50 MB of attachments to avoid long encrypt/decrypt times.', ru: '?? ??????????? ??????? ?????? ???????? ????????????? ??????? ?? 50 ??, ????? ???????? ??????? ?????????? ? ???????????.' },
  'noteComposer.share.unavailable': { de: 'Teilen nicht möglich', en: 'Share unavailable', ru: 'Нельзя поделиться' },
  'noteComposer.share.unsupported': { de: 'Diese Plattform unterstützt keinen Teilen-Dialog.', en: 'This platform does not support the share dialog.', ru: 'Эта платформа не поддерживает окно "Поделиться".' },
  'noteComposer.share.dialogTitle': { de: 'Datei teilen', en: 'Share file', ru: 'Поделиться файлом' },
  'noteComposer.share.failed': { de: 'Teilen fehlgeschlagen', en: 'Share failed', ru: 'Не удалось поделиться' },
  'noteComposer.export.noFolderTitle': { de: 'Ordner nicht ausgewählt', en: 'Folder not selected', ru: 'Папка не выбрана' },
  'noteComposer.export.noFolderMessage': { de: 'Bitte wähle einen Zielordner aus.', en: 'Please choose a target folder.', ru: 'Выберите папку для сохранения.' },
  'noteComposer.export.copySaved': { de: 'Kopie gespeichert', en: 'Copy saved', ru: 'Копия сохранена' },
  'noteComposer.export.unavailable': { de: 'Export nicht möglich', en: 'Export unavailable', ru: 'Экспорт недоступен' },
  'noteComposer.export.unsupported': { de: 'Diese Plattform unterstützt keinen Export.', en: 'This platform does not support export.', ru: 'Эта платформа не поддерживает экспорт.' },
  'noteComposer.export.failed': { de: 'Export fehlgeschlagen', en: 'Export failed', ru: 'Не удалось выполнить экспорт' },
  'noteComposer.export.dialogTitle': { de: 'Datei exportieren', en: 'Export file', ru: 'Экспорт файла' },
  'noteComposer.preview.imageFallback': { de: 'Bild', en: 'Image', ru: 'Изображение' },
  'noteComposer.preview.videoFallback': { de: 'Video', en: 'Video', ru: 'Видео' },
  'settings.theme.light': { de: 'Hell', en: 'Light', ru: 'Светлая' },
  'settings.theme.lightDescription': { de: 'Klares, helles Layout', en: 'Bright, clean layout', ru: 'Яркая и лёгкая тема' },
  'settings.theme.dusk': { de: 'Dämmerung', en: 'Dusk', ru: 'Сумерки' },
  'settings.theme.duskDescription': { de: 'Gedimmte Mischung', en: 'Soft, dimmed blend', ru: 'Мягкая приглушённая тема' },
  'settings.theme.dark': { de: 'Dunkel', en: 'Dark', ru: 'Тёмная' },
  'settings.theme.darkDescription': { de: 'OLED-freundlich', en: 'OLED-friendly', ru: 'Тема для OLED' },
  'settings.theme.title': { de: 'Theme', en: 'Theme', ru: 'Тема' },
  'settings.language.title': { de: 'Sprache', en: 'Language', ru: 'Язык' },
  'settings.language.subtitle': { de: 'Wähle die App-Sprache', en: 'Choose the app language', ru: 'Выберите язык приложения' },
  'settings.language.german': { de: 'Deutsch', en: 'German', ru: 'Немецкий' },
  'settings.language.germanDescription': { de: 'Alle Texte auf Deutsch', en: 'All text in German', ru: 'Все тексты на немецком' },
  'settings.language.english': { de: 'Englisch', en: 'English', ru: 'Английский' },
  'settings.language.englishDescription': { de: 'Alle Texte auf Englisch', en: 'All text in English', ru: 'Все тексты на английском' },
  'settings.language.russian': { de: 'Russisch', en: 'Russian', ru: 'Русский' },
  'settings.language.russianDescription': { de: 'Alle Texte auf Russisch', en: 'All text in Russian', ru: 'Все тексты на русском' },
  'settings.pin.title': { de: 'App-PIN', en: 'App PIN', ru: 'PIN-код приложения' },
  'settings.pin.currentPlaceholder': { de: 'Aktuellen PIN eingeben', en: 'Enter current PIN', ru: 'Введите текущий PIN' },
  'settings.pin.newPlaceholder': { de: 'Neue PIN (4+ Ziffern)', en: 'New PIN (4+ digits)', ru: 'Новый PIN (4+ цифр)' },
  'settings.pin.confirmPlaceholder': { de: 'PIN bestätigen', en: 'Confirm PIN', ru: 'Подтвердите PIN' },
  'settings.pin.enable': { de: 'PIN aktivieren', en: 'Enable PIN', ru: 'Включить PIN' },
  'settings.pin.disable': { de: 'PIN deaktivieren', en: 'Disable PIN', ru: 'Отключить PIN' },
  'settings.pin.feedback.enterCurrent': { de: 'Bitte aktuellen PIN eingeben.', en: 'Please enter your current PIN.', ru: 'Введите текущий PIN-код.' },
  'settings.pin.feedback.invalid': { de: 'Falscher PIN.', en: 'Incorrect PIN.', ru: 'Неверный PIN-код.' },
  'settings.pin.feedback.disabled': { de: 'PIN deaktiviert', en: 'PIN disabled', ru: 'PIN отключён' },
  'settings.pin.feedback.tooShort': { de: 'PIN zu kurz (mind. 4 Ziffern).', en: 'PIN too short (min. 4 digits).', ru: 'PIN слишком короткий (мин. 4 цифры).' },
  'settings.pin.feedback.mismatch': { de: 'PINs stimmen nicht überein.', en: 'PINs do not match.', ru: 'PIN-коды не совпадают.' },
  'settings.pin.feedback.enabled': { de: 'PIN gesetzt', en: 'PIN enabled', ru: 'PIN установлен' },
  'settings.backup.title': { de: 'Backup & Import', en: 'Backup & import', ru: 'Резервное копирование и импорт' },
  'settings.backup.exportAction': { de: 'Backup exportieren', en: 'Export backup', ru: 'Экспортировать резервную копию' },
  'settings.backup.importAction': { de: 'Backup importieren', en: 'Import backup', ru: 'Импортировать резервную копию' },
  'settings.backup.exportSuccess': { de: 'Backup erstellt', en: 'Backup created', ru: 'Резервная копия создана' },
  'settings.backup.exportError': { de: 'Fehler beim Export', en: 'Export failed', ru: 'Ошибка при экспорте' },
  'settings.backup.importSuccess': { de: 'Import abgeschlossen', en: 'Import complete', ru: 'Импорт завершён' },
  'settings.backup.importError': { de: 'Fehler beim Import', en: 'Import failed', ru: 'Ошибка при импорте' },
  'settings.storage.calculating': { de: 'Speichernutzung: Berechne...', en: 'Storage usage: calculating...', ru: 'Использование памяти: расчёт...' },
  'settings.storage.usage': { de: 'Speichernutzung: {{ value }} MB', en: 'Storage usage: {{ value }} MB', ru: 'Использование памяти: {{ value }} МБ' },
  'settings.wipe.title': { de: 'Daten & Speicher', en: 'Data & storage', ru: 'Данные и память' },
  'settings.wipe.warning': { de: 'Vorsicht: Dieser Vorgang entfernt alle Notizen, Checklisten, Anhänge (verschlüsselt & unverschlüsselt) unwiderruflich.', en: 'Warning: this removes all notes, checklists, and attachments (encrypted & unencrypted) permanently.', ru: 'Внимание: операция навсегда удалит все заметки, чек-листы и вложения (включая зашифрованные).' },
  'settings.wipe.deleteButton': { de: 'Alle Daten löschen', en: 'Delete all data', ru: 'Удалить все данные' },
  'settings.wipe.pinTitle': { de: 'PIN für Datenlöschung', en: 'PIN for data deletion', ru: 'PIN для удаления данных' },
  'settings.wipe.pinPlaceholder': { de: 'PIN eingeben', en: 'Enter PIN', ru: 'Введите PIN' },
  'settings.common.continue': { de: 'Weiter', en: 'Continue', ru: 'Далее' },
  'settings.wipe.confirmTitle': { de: 'Alle Daten löschen?', en: 'Delete all data?', ru: 'Удалить все данные?' },
  'settings.wipe.confirmWarning': { de: 'Damit werden sämtliche Notizen, Anhänge und verschlüsselte Inhalte dauerhaft entfernt.', en: 'This removes all notes, attachments, and encrypted content permanently.', ru: 'Это полностью удалит все заметки, вложения и зашифрованный контент.' },
  'settings.wipe.deleting': { de: 'Lösche...', en: 'Deleting...', ru: 'Удаление...' },
  'settings.wipe.confirmDelete': { de: 'Jetzt löschen', en: 'Delete now', ru: 'Удалить сейчас' },
  'settings.wipe.errors.tooShort': { de: 'PIN zu kurz.', en: 'PIN too short.', ru: 'PIN слишком короткий.' },
  'settings.wipe.errors.invalid': { de: 'Falscher PIN.', en: 'Incorrect PIN.', ru: 'Неверный PIN-код.' },
  'settings.wipe.success': { de: 'Alle Daten gelöscht', en: 'All data deleted', ru: 'Все данные удалены' },
  'settings.wipe.error': { de: 'Fehler beim Löschen', en: 'Deletion failed', ru: 'Ошибка при удалении' },
  'settings.privacy.title': { de: 'Datenschutz', en: 'Privacy', ru: 'Конфиденциальность' },
  'settings.privacy.viewPolicy': { de: 'Datenschutzerklärung ansehen', en: 'View privacy policy', ru: 'Посмотреть политику конфиденциальности' },
} as const;

export type TranslationKey = keyof typeof rawEntries;

type RawEntry = typeof rawEntries[TranslationKey];

const buildTranslations = () => {
  const map: Record<LanguageCode, Record<TranslationKey, string>> = {
    de: Object.create(null),
    en: Object.create(null),
    ru: Object.create(null),
  } as Record<LanguageCode, Record<TranslationKey, string>>;

  (Object.entries(rawEntries) as [TranslationKey, RawEntry][]).forEach(([key, value]) => {
    map.de[key] = value.de;
    map.en[key] = value.en;
    map.ru[key] = value.ru;
  });

  return map;
};

const translations = buildTranslations();

const formatMessage = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template;
  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
  }, template);
};

export const translateByLanguage = (
  language: LanguageCode,
  key: TranslationKey,
  params?: Record<string, string | number>
) => {
  const template = translations[language][key] ?? translations.de[key] ?? key;
  return formatMessage(template, params);
};



