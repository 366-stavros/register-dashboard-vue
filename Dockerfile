FROM node:16-alpine3.12
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn run build --mode production --dest ./backend/app/views
WORKDIR /app/backend
RUN yarn install
RUN npm install -g ts-node