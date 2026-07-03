import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export function getCategories() {
  return apiGet("/categorias");
}

export function createCategory(data, token) {
  return apiPost("/categorias", data, { token });
}

export function updateCategory(id, data, token) {
  return apiPut(`/categorias/${id}`, data, { token });
}

export function deleteCategory(id, token) {
  return apiDelete(`/categorias/${id}`, { token });
}
