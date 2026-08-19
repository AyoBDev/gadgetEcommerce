import { default as default_d6f5bca068c60db7a4a78b2e4cf289dc } from '@/components/admin/ConversationThread'
import { default as default_a9d4b87e0306b3ddfe97926a52a69591 } from '@/components/admin/Nav'
import { default as default_7b57228c6f06a06348e4c53967f631ca } from '@/components/admin/DashboardStats'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@/components/admin/ConversationThread#default": default_d6f5bca068c60db7a4a78b2e4cf289dc,
  "@/components/admin/Nav#default": default_a9d4b87e0306b3ddfe97926a52a69591,
  "@/components/admin/DashboardStats#default": default_7b57228c6f06a06348e4c53967f631ca,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
