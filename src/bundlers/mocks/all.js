// import express from 'express';
export default function express() {
  return { Router };
}

// import { Router } from 'express';
export function Router() {
  return 'mock';
}
express.Router = Router;

// Vite
export function createServer() {
  return 'mock';
}

// html-webpack-plugin
export function BundleAnalyzerPlugin() {
  return 'mock';
}

// swc-minify-webpack-plugin
export function SwcMinifyWebpackPlugin() {
  return 'mock';
}
