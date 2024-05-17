#!/usr/bin/env bash

set -ex

pnpm run script:pack --dest templates/blank-3.0
cd templates/blank-3.0
cp .env.example .env
ls -la
pnpm add ./*.tgz

# "pnpm": {
#     "overrides": {
#       "@payloadcms/db-mongodb": "file:payloadcms-db-mongodb-3.0.0-beta.34.tgz",
#       "@payloadcms/graphql": "file:payloadcms-graphql-3.0.0-beta.34.tgz"
#       "@payloadcms/next": "file:payloadcms-next-3.0.0-beta.34.tgz",
#       "@payloadcms/richtext-lexical": "file:payloadcms-richtext-lexical-3.0.0-beta.34.tgz",
#       "@payloadcms/translations": "file:payloadcms-translations-3.0.0-beta.34.tgz",
#       "@payloadcms/ui": "file:payloadcms-ui-3.0.0-beta.34.tgz",
#       "payload": "file:payload-3.0.0-beta.34.tgz"
#     }
#   }

# get db-mongodb version
db_mongodb_version=$(jq -r '.dependencies["@payloadcms/db-mongodb"]' package.json)
graphql=$(jq -r '.dependencies["@payloadcms/graphql"]' package.json)
next=$(jq -r '.dependencies["@payloadcms/next"]' package.json)
richtext_lexical=$(jq -r '.dependencies["@payloadcms/richtext-lexical"]' package.json)
translations=$(jq -r '.dependencies["@payloadcms/translations"]' package.json)
ui=$(jq -r '.dependencies["@payloadcms/ui"]' package.json)
payload=$(jq -r '.dependencies.payload' package.json)

echo "db_mongodb_version: $db_mongodb_version"
echo "next: $next"
echo "richtext_lexical: $richtext_lexical"
echo "translations: $translations"
echo "ui: $ui"
echo "payload: $payload"
echo "graphql: $graphql"


# set pnpm overrides to the above versions
jq '.pnpm.overrides["@payloadcms/db-mongodb"] = "'$db_mongodb_version'"' package.json > tmp.$$.json && mv tmp.$$.json package.json
jq '.pnpm.overrides["@payloadcms/graphql"] = "'$graphql'"' package.json > tmp.$$.json && mv tmp.$$.json package.json
jq '.pnpm.overrides["@payloadcms/next"] = "'$next'"' package.json > tmp.$$.json && mv tmp.$$.json package.json
jq '.pnpm.overrides["@payloadcms/richtext-lexical"] = "'$richtext_lexical'"' package.json > tmp.$$.json && mv tmp.$$.json package.json
jq '.pnpm.overrides["@payloadcms/translations"] = "'$translations'"' package.json > tmp.$$.json && mv tmp.$$.json package.json
jq '.pnpm.overrides["@payloadcms/ui"] = "'$ui'"' package.json > tmp.$$.json && mv tmp.$$.json package.json
jq '.pnpm.overrides.payload = "'$payload'"' package.json > tmp.$$.json && mv tmp.$$.json package.json


pnpm install --ignore-workspace
cat package.json
pnpm run build
