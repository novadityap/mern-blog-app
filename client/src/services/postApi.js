import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '@/app/baseQuery.js';

const postApi = createApi({
  reducerPath: 'postApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    createPost: builder.mutation({
      query: data => ({
        url: '/posts',
        method: 'POST',
        data,
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    }),
    searchPosts: builder.query({
      query: (params = {}) => ({
        url: '/posts',
        method: 'GET',
        params,
      }),
    }),
    showPost: builder.query({
      query: postId => ({
        url: `/posts/${postId}`,
        method: 'GET',
      }),
    }),
    removePost: builder.mutation({
      query: postId => ({
        url: `/posts/${postId}`,
        method: 'DELETE',
      }),
    }),
    updatePost: builder.mutation({
      query: ({ data, postId }) => ({
        url: `/posts/${postId}`,
        method: 'PUT',
        data,
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    }),
    likePost: builder.mutation({
      query: postId => ({
        url: `/posts/${postId}/like`,
        method: 'PATCH',
      }),
    }),
  }),
});

export const {
  useSearchPostsQuery,
  useLazySearchPostsQuery,
  useShowPostQuery,
  useLazyShowPostQuery,
  useLikePostMutation,
  useCreatePostMutation,
  useUpdatePostMutation,
  useRemovePostMutation,
} = postApi;

export default postApi;
