import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import { Challenge, Post } from '@/app/models/Community';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - Fetch challenges and community posts
export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'challenges' or 'posts'
    const limit = parseInt(url.searchParams.get('limit') || '20');

    await connectDB();

    if (type === 'challenges') {
      const challenges = await Challenge.find({ isActive: true })
        .populate('createdBy', 'name')
        .populate('participants.userId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

      return NextResponse.json({ challenges });
    } else if (type === 'posts') {
      const posts = await Post.find({ isActive: true })
        .populate('userId', 'name')
        .populate('recipeId', 'name')
        .populate('challengeId', 'title')
        .populate('comments.userId', 'name')
        .populate('likes.userId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

      return NextResponse.json({ posts });
    } else {
      // Return both challenges and posts
      const [challenges, posts] = await Promise.all([
        Challenge.find({ isActive: true })
          .populate('createdBy', 'name')
          .sort({ createdAt: -1 })
          .limit(10),
        Post.find({ isActive: true })
          .populate('userId', 'name')
          .populate('recipeId', 'name')
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

      return NextResponse.json({ challenges, posts });
    }
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Error fetching community data:', error);
    } else {
      console.error('Error fetching community data:', error);
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

// POST - Create a new challenge or post
export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const { type, data } = await req.json();

    if (!type || !data) {
      return NextResponse.json({ message: 'Type and data are required' }, { status: 400 });
    }

    await connectDB();

    if (type === 'challenge') {
      const { title, description, challengeType, startDate, endDate, goal, maxParticipants } = data;

      if (!title || !description || !challengeType || !startDate || !endDate || !goal) {
        return NextResponse.json(
          { message: 'All challenge fields are required' },
          { status: 400 }
        );
      }

      const challenge = await Challenge.create({
        title,
        description,
        type: challengeType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        goal,
        maxParticipants: maxParticipants || 100,
        createdBy: decoded.id,
        participants: [{
          userId: decoded.id,
          joinedAt: new Date(),
          progress: 0,
          lastUpdate: new Date()
        }]
      });

      const populatedChallenge = await Challenge.findById(challenge._id)
        .populate('createdBy', 'name')
        .populate('participants.userId', 'name');

      return NextResponse.json(populatedChallenge, { status: 201 });

    } else if (type === 'post') {
      const { postType, title, content, images, recipeId, challengeId } = data;

      if (!postType || !title || !content) {
        return NextResponse.json(
          { message: 'Post type, title, and content are required' },
          { status: 400 }
        );
      }

      const post = await Post.create({
        userId: decoded.id,
        type: postType,
        title,
        content,
        images: images || [],
        recipeId: recipeId || undefined,
        challengeId: challengeId || undefined
      });

      const populatedPost = await Post.findById(post._id)
        .populate('userId', 'name')
        .populate('recipeId', 'name')
        .populate('challengeId', 'title');

      return NextResponse.json(populatedPost, { status: 201 });

    } else {
      return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Error creating community content:', error);
    } else {
      console.error('Error creating community content:', error);
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

// PUT - Update challenge participation, post likes, or comments
export async function PUT(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const { action, targetId, data } = await req.json();

    if (!action || !targetId) {
      return NextResponse.json({ message: 'Action and target ID are required' }, { status: 400 });
    }

    await connectDB();

    switch (action) {
      case 'join-challenge': {
        const challenge = await Challenge.findById(targetId);
        if (!challenge) {
          return NextResponse.json({ message: 'Challenge not found' }, { status: 404 });
        }

        // Check if user is already a participant
        const isParticipant = challenge.participants.some(
          (p: { userId: { toString(): string } }) => p.userId.toString() === decoded.id
        );

        if (isParticipant) {
          return NextResponse.json({ message: 'Already participating in this challenge' }, { status: 400 });
        }

        // Check if challenge is full
        if (challenge.participants.length >= challenge.maxParticipants) {
          return NextResponse.json({ message: 'Challenge is full' }, { status: 400 });
        }

        challenge.participants.push({
          userId: decoded.id,
          joinedAt: new Date(),
          progress: 0,
          lastUpdate: new Date()
        });

        await challenge.save();

        const updatedChallenge = await Challenge.findById(targetId)
          .populate('createdBy', 'name')
          .populate('participants.userId', 'name');

        return NextResponse.json(updatedChallenge);
      }
      case 'update-progress': {
        const progressChallenge = await Challenge.findById(targetId);
        if (!progressChallenge) {
          return NextResponse.json({ message: 'Challenge not found' }, { status: 404 });
        }

        const participant = progressChallenge.participants.find(
          (p: { userId: { toString(): string } }) => p.userId.toString() === decoded.id
        );

        if (!participant) {
          return NextResponse.json({ message: 'Not a participant in this challenge' }, { status: 400 });
        }

        participant.progress = data.progress || 0;
        participant.lastUpdate = new Date();

        await progressChallenge.save();
        return NextResponse.json({ message: 'Progress updated successfully' });
      }
      case 'like-post': {
        const post = await Post.findById(targetId);
        if (!post) {
          return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        const existingLike = post.likes.find(
          (like: { userId: { toString(): string } }) => like.userId.toString() === decoded.id
        );

        if (existingLike) {
          // Remove like
          post.likes = post.likes.filter(
            (like: { userId: { toString(): string } }) => like.userId.toString() !== decoded.id
          );
        } else {
          // Add like
          post.likes.push({
            userId: decoded.id,
            likedAt: new Date()
          });
        }

        await post.save();
        return NextResponse.json({ liked: !existingLike, likesCount: post.likes.length });
      }
      case 'add-comment': {
        const commentPost = await Post.findById(targetId);
        if (!commentPost) {
          return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        if (!data.content) {
          return NextResponse.json({ message: 'Comment content is required' }, { status: 400 });
        }

        commentPost.comments.push({
          userId: decoded.id,
          content: data.content,
          createdAt: new Date()
        });

        await commentPost.save();

        const updatedPost = await Post.findById(targetId)
          .populate('userId', 'name')
          .populate('comments.userId', 'name');

        return NextResponse.json(updatedPost);
      }
      default: {
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
      }
    }
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Error updating community content:', error);
    } else {
      console.error('Error updating community content:', error);
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

