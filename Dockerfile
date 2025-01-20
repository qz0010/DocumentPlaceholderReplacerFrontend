# Первый этап: сборка (builder)
FROM node:20 as builder

WORKDIR /app

# Устанавливаем все зависимости и собираем
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:prod

# Второй этап: минимальный образ для запуска приложения
FROM node:20-alpine as production
ENV NODE_ENV=production

WORKDIR /app

# Копируем только то, что нужно для запуска (папку dist и package*.json)
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package*.json ./

# Ставим только продакшен-зависимости
RUN npm ci --production

EXPOSE 8080
CMD ["npm", "run", "serve:prod"]
