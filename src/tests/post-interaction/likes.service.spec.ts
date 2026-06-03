// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LikesService } from '../../modules/likes/likes.service';
import { createQueryChain, createSaveModel } from '../helpers/mongoose-chain';

describe('LikesService', () => {
  const firebaseService = {
    writeNotification: jest.fn().mockResolvedValue(undefined),
  };

  const userInteractionsService = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const adminService = {
    writeUserActivity: jest.fn().mockResolvedValue(undefined),
  };

  let likeModel: any;
  let userModel: any;
  let postModel: any;
  let commentModel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    likeModel = createSaveModel({
      _id: 'like-1',
      user_id: 'user-1',
      post_id: 'post-1',
    });
    likeModel.findOne = jest.fn(() => createQueryChain(null));
    likeModel.findByIdAndDelete = jest.fn(() => ({ exec: jest.fn().mockResolvedValue({}) }));
    likeModel.find = jest.fn(() => createQueryChain([]));

    userModel = {
      findById: jest.fn(() => createQueryChain({ _id: 'user-1', full_name: 'User One', username: 'userone' })),
    };

    postModel = {
      findById: jest.fn(() => createQueryChain({ _id: 'post-1', user_id: 'post-owner' })),
    };

    commentModel = {
      findById: jest.fn(() => createQueryChain({ _id: 'comment-1', user_id: 'comment-owner' })),
    };
  });

  function createService() {
    return new LikesService(
      likeModel,
      userModel,
      postModel,
      commentModel,
      firebaseService as any,
      userInteractionsService as any,
      adminService as any,
    );
  }

  it('creates a post like and records recommendation interaction', async () => {
    const service = createService();

    const result = await service.toggleLike({
      user_id: 'user-1',
      post_id: 'post-1',
    } as any);

    expect(result).toMatchObject({ liked: true });
    expect(userInteractionsService.record).toHaveBeenCalledWith({
      user_id: 'user-1',
      post_id: 'post-1',
      interaction_type: expect.any(String),
    });
    expect(firebaseService.writeNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'post-owner', type: 'like', ref_type: 'post' }),
    );
  });

  it('removes an existing like on second toggle', async () => {
    likeModel.findOne = jest.fn(() => createQueryChain({ _id: 'like-existing' }));
    const service = createService();

    const result = await service.toggleLike({
      user_id: 'user-1',
      post_id: 'post-1',
    } as any);

    expect(likeModel.findByIdAndDelete).toHaveBeenCalledWith('like-existing');
    expect(result).toEqual({ liked: false });
  });

  it('checks whether a user liked a post', async () => {
    likeModel.findOne = jest.fn(() => createQueryChain({ _id: 'like-existing' }));
    const service = createService();

    await expect(service.checkLike('user-1', 'post-1')).resolves.toBe(true);
  });
});