#!/bin/bash
export $(cat .env | xargs) && \
docker buildx build --platform linux/amd64,linux/arm64 \
    --build-arg DATABASE_URI=$DATABASE_URI \
    --build-arg PAYLOAD_SECRET=$PAYLOAD_SECRET \
    --build-arg PAYLOAD_PUBLIC_SERVER_URL=$PAYLOAD_PUBLIC_SERVER_URL \
    --build-arg NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL \
    --build-arg NEXT_PUBLIC_IS_LIVE=$NEXT_PUBLIC_IS_LIVE \
    --build-arg PAYLOAD_PUBLIC_DRAFT_SECRET=$PAYLOAD_PUBLIC_DRAFT_SECRET \
    --build-arg NEXT_PRIVATE_DRAFT_SECRET=$NEXT_PRIVATE_DRAFT_SECRET \
    --build-arg REVALIDATION_KEY=$REVALIDATION_KEY \
    --build-arg NEXT_PRIVATE_REVALIDATION_KEY=$NEXT_PRIVATE_REVALIDATION_KEY \
    -t your_name/website_web-app:latest --push .
echo ***] ****VERY IMPORTANT NO COMMENTS in .ENV FILE
echo ***]
echo ***] ON SERVER RUN LIKE THIS
echo ***] docker stop docker_web
echo ***] docker rm docker_web
echo ***] docker pull your_name/flightone_web-app:latest
echo ***] docker image prune -f
echo ***] docker run -d --name docker_web   --restart unless-stopped -p 3000:3000   --env-file ~/your.env -v /var/www/media:/var/www/media your_name/payload_web-app:latest
