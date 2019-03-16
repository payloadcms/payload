@ECHO OFF

sc query "MongoDB" | findstr "RUNNING"
if errorlevel 1 (
    net start "MongoDB Server"
) else (
    net stop "MongoDB Server"
)
