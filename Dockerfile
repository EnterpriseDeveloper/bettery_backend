FROM node:24.1.0-slim
WORKDIR '/app'
COPY . .
RUN npm install
EXPOSE 80 443 8090 26657
CMD ["npm", "run", "dev"]