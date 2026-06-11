## 🧭 Architektura i Nawigacja Backend (`server.js`)


[🧭 Powrót do README.md](../README.md)

<details>
<summary> 🏗️ CORE SETUPS (0 - 5)</summary>

* 📍 **0. Optional external log terminal** -> Inicjalizacja gniazda TCP do przesyłania logów.
* 📍 **1. Cool looking log system** -> System wrapperów wizualnych konsoli (moduł `chalk`).
* 📍 **2. MailBot setup and startup** -> Konfiguracja i uwierzytelnianie Nodemailer.
* 📍 **3. Database setup and startup** -> Schemat migracji i rozruch SQLite3.
* 📍 **4. Server setup and startup** -> Interceptory ruchu, statystyki i czyszczenie śmieci.
* 📍 **5. Express setup and startup** -> Konfiguracja Express, HTTP Server oraz Socket.io.
</details>

<details>
<summary> 🔌 WEBSOCKET SETUP AND HANDLING (6 - 13)</summary>

* 📍 **6. Broadcast online status** -> Synchronizacja globalnej listy aktywnych użytkowników.
* 📍 **7. Socket setup, startup and handling** -> Główny hook połączeń WebSocket.
* 📍 **8. Socket identification** -> Autoryzacja sesji, mapowanie gniazd i obsługa multisesji.
* 📍 **9. Socket logout** -> Procedura bezpiecznego wyczyszczenia sesji po wylogowaniu.
* 📍 **10. Socket disconnection** -> Autoczyszczenie pamięci po nagłym rozłączeniu.
* 📍 **11. Socket chat history** -> Pobieranie historii wiadomości czatu (SQL LEFT JOIN).
* 📍 **12. Socket send message** -> Przetwarzanie, walidacja i bezpieczny zapis wiadomości.
* 📍 **13. Live chat message handling** -> Middleware do przekierowania logów żądań HTTP.
</details>

<details>
<summary> 🛣️ REST API ENDPOINTS (14 - 35)</summary>

* 📍 **14. API: Get user tickets** -> `GET /api/tickets/:userId` - Zgłoszenia użytkownika.
* 📍 **15. API: Create ticket** -> `POST /api/tickets` - Generowanie nowego tiketu.
* 📍 **16. API: Get all tickets** -> `GET /api/admin/tickets` - Globalna lista dla admina.
* 📍 **17. API: Get mailbox** -> `GET /api/mailbox/:userId` - Skrzynka odbiorcza.
* 📍 **18. API: Create mailbox** -> `POST /api/mailbox` - Wysyłka wiadomości (inbox/sent).
* 📍 **19. API: Delete mailbox** -> `POST /api/mailbox/:id/delete` - Kosz / stałe usunięcie.
* 📍 **20. API: Send mailbox** -> `POST /api/mailbox` - Powiadomienia powiązane z tiketami.
* 📍 **21. API: Mark mailbox as read** -> `PUT /api/mailbox/read/:id` - Zmiana stanu przeczytania.
* 📍 **22. API: Get unread mailbox count** -> `GET /api/mailbox/:userId/unread-count` - Licznik dla UI.
* 📍 **23. API: Update ticket status** -> `PATCH /api/admin/tickets/:id` - Zmiana statusu tiketów.
* 📍 **24. API: Reply to ticket** -> `POST /api/admin/tickets/:id/reply` - Odpowiedź administratora.
* 📍 **25. API: Delete ticket** -> `DELETE /api/admin/tickets/:id` - Usunięcie zgłoszenia.
* 📍 **26. API: Admin update user** -> `POST /api/admin/update-user - Aktualizacja profilu użytkownika.
* 📍 **27. API: Login** -> `POST /api/login` - Logowanie użytkownika.
* 📍 **28. API: Register** -> `POST /api/register` - Rejestracja nowego użytkownika.
* 📍 **29. API: User update profile** -> `POST /api/update-profile` - Aktualizacja profilu użytkownika.
* 📍 **30. API: User settings** -> `POST /api/settings` - Aktualizacja ustawień użytkownika.
* 📍 **31. API: Delete user** -> `DELETE /api/users/:id` - Usunięcie użytkownika.
* 📍 **32. API: Upgrade user to PLUS** -> `POST /api/upgrade` - Aktualizacja role użytkownika.
* 📍 **33. API: Cancel user premium** -> `POST /api/cancel-premium` - Anulowanie subskrypcji użytkownika.
* 📍 **34. API: Get PLK IC API usage statistics** -> `GET /api/statistics` - Statystyki użycia API PLK IC.
* 📍 **35. API: Unlock secret** -> `POST /api/secret-unlock` - Odblokowanie sekretu użytkownika.
</details>

<details>
<summary> 🛣️ GTFS ENDPOINTS (36)</summary>

* 📍 **36. GTFS: GTFS data precache for faster loading, initalization and maintenance of GTFS data** -> `GET /api/stations` - Pobieranie danych.
</details>

<details>
<summary> 🛣️ OTHER API ENDPOINTS (37 - 56)</summary>

* 📍 **37. API: Health check** -> `GET /api/health` - Sprawdzenie stanu serwera.
* 📍 **38. API: Stations list** -> `GET /api/stations` - Pobieranie listy stacji.
* 📍 **39. API: Timetable** -> `GET /api/timetable/:id` - Pobieranie planu na stacji.
* 📍 **40. API: Train search** -> `GET /api/trains/search` - Wyszukiwanie pojedynczego pociągu.
* 📍 **41. API: Train details** -> `GET /api/trains/:id` - Pobieranie szczegółów pojedynczego pociągu.
* 📍 **42. API: Station details** -> `GET /api/stations/:id` - Pobieranie szczegółów stacji.
* 📍 **43. API: Admin users list** -> `GET /api/admin/users` - Pobieranie listy użytkowników.
* 📍 **44. API: Admin users update** -> `PUT /api/admin/users/:id` - Aktualizacja użytkownika.
* 📍 **45. API: Users auto-update** -> `PUT /api/users/:id` - Aktualizacja użytkownika.
* 📍 **46. API: Users delete** -> `DELETE /api/users/:id` - Usunięcie użytkownika.
* 📍 **47. API: Stats** -> `GET /api/stats` - Pobieranie statystyk.
* 📍 **48. DATA: Todos reading** -> `GET /api/todos` - Pobieranie listy zadań.
* 📍 **49. DATA: Todos writing** -> `POST /api/todos` - Dodawanie zadań.
* 📍 **50. API: Forgot password ( Automated email responce )** -> `POST /api/forgot-password` - Wysyłka wiadomości resetującej hasło.
* 📍 **51. API: Reset password** -> `POST /api/reset-password` - Resetowanie hasła użytkownika.
* 📍 **52. API: User update profile** -> `POST /api/update-profile` - Aktualizacja profilu użytkownika.
* 📍 **53. API: Logout** -> `DELETE /api/users/:id` - Wylogowanie użytkownika.
* 📍 **54. API: Post-exit sequence** -> `POST /api/exit` - Funkcja wykonująca komendy `taskkill` i reboot skryptów bat.
* 📍 **55. API: Exit and restart phrase listener** -> `POST /api/restart` - Interaktywny interfejs CLI serwera przez `process.stdin`.
</details>

<details>
<summary> 🎭 TERMINAL PROCEDURES (57-58)</summary>

* 📍 **56. CMD: Post-exit sequence ( doesn't for now! )** -> Funkcja wykonująca komendy `taskkill` i reboot skryptów bat.
* 📍 **57. CMD: Exit and restart phrase listener** -> Interaktywny interfejs CLI serwera przez `process.stdin`.
* 📍 **58. CMD: SIGINT listener ( ALT + C)** -> Wyzwalanie `SIGINT` w procesie Node.
</details>

---