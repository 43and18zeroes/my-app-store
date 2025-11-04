REM "./scripts/up.bat" comment

echo -------------------------------------------
echo Building gallery manifests before commit...
echo -------------------------------------------
node scripts/build-gallery-manifests.mjs
IF %ERRORLEVEL% NEQ 0 (
    echo Error while generating gallery.json, commit aborted.
    exit /b %ERRORLEVEL%
)

echo -------------------------------------------
echo Adding and committing changes...
echo -------------------------------------------
git add .
git commit -m "%*"
git push

echo -------------------------------------------
echo Push complete!
echo -------------------------------------------