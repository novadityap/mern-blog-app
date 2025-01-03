import axiosBaseQuery from "@/app/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";

const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    searchCategories: builder.query({
      query: (params = {}) => ({
        url: "/categories",
        method: "GET",
        params,
      }),
    }),
    listCategories: builder.query({
      query: () => ({
        url: "/categories/list",
        method: "GET",
      }),
    }),
    showCategory: builder.query({
      query: categoryId => ({
        url: `/categories/${categoryId}`,
        method: "GET",
      }),
    }),
    createCategory: builder.mutation({
      query: data => ({
        url: "/categories",
        method: "POST",
        data,
      }),
    }),
    updateCategory: builder.mutation({
      query: ({ categoryId, data }) => ({
        url: `/categories/${categoryId}`,
        method: "PUT",
        data,
      }),
    }),
    removeCategory: builder.mutation({
      query: categoryId => ({
        url: `/categories/${categoryId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useSearchCategoriesQuery,
  useLazySearchCategoriesQuery,
  useListCategoriesQuery,
  useLazyListCategoriesQuery,
  useShowCategoryQuery,
  useLazyShowCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useRemoveCategoryMutation,
} = categoryApi;

export default categoryApi;