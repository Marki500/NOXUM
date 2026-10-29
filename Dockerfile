FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# The prepare script builds the site; run it once, after all sources are copied.
RUN npm ci --include=dev --ignore-scripts
COPY . .
RUN npm run build && npm run check

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
