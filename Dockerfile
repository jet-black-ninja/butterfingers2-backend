#syntax = docker/dockerfile:1

#Adjust NODE_VERSION 
FROM node:23-slim AS base


#Node.js app location
WORKDIR /app

#set production environment
ENV NODE_ENV=production

FROM base AS build

#install the packages needed to build node modules
RUN apt-get update -qq && \ 
    apt-get install -y build-essential pkg-config python3 python-is-python3

#Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci --include=dev

#copy code from folder
COPY --link . .

#build application 
RUN npm run build

##remove dev dependencies 
RUN npm prune -omit=dev

#final stages 
FROM base

#copy build application
COPY --from=build /app /app

#start the server by default
EXPOSE 5000
CMD ["npm", "run", "start"]