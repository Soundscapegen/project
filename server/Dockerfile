FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 3001

CMD ["./entrypoint.sh"]
