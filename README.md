# Data Model

## Users Collection

Description: Collection to store user information.

Fields:
- `_id`: ObjectId - The unique identifier for the user.
- `username`: String - The username of the user.
- `password`: String - The password of the user.
- `groups`: Array of ObjectIds - References to UserGroups Collection.
- ...

## Authentication Collection

Description: Collection to store authentication tokens.

Fields:
- `_id`: ObjectId - The unique identifier for the authentication record.
- `userId`: Reference to Users Collection - The reference to the associated user.
- `token`: String - The authentication token.
- `expiresAt`: Date - The expiration date of the token.
- ...

## UserGroups Collection

Description: Collection to store user groups.

Fields:
- `_id`: ObjectId - The unique identifier for the user group.
- `name`: String - The name of the user group.
- ...

## Colors Collection

Description: Collection to store colors.

Fields:
- `_id`: ObjectId - The unique identifier for the color.
- `name`: String - The name of the color.
- `code`: String - The code representing the color.
- ...

## Grids Collection

Description: Collection to store grids.

Fields:
- `_id`: ObjectId - The unique identifier for the grid.
- `name`: String - The name of the grid.
- `ownerId`: Reference to Users Collection - The reference to the owner of the grid.
- `groupId`: Reference to UserGroups Collection (nullable) - The reference to the user group of the grid (optional).
- `isPublic`: Boolean - Flag indicating if the grid is public.
- `tagIds`: Array of ObjectIds - References to Tags Collection.
- `description`: String - The description of the grid.
- `schedule`: Object - The scheduling information for the grid.
  - `startTime`: Date - The start time of the grid.
  - `endTime`: Date - The end time of the grid.
- ...

## Tags Collection

Description: Collection to store tags.

Fields:
- `_id`: ObjectId - The unique identifier for the tag.
- `name`: String - The name of the tag.
- ...

## Pixels Collection

Description: Collection to store pixels.

Fields:
- `_id`: ObjectId - The unique identifier for the pixel.
- `gridId`: Reference to Grids Collection - The reference to the parent grid.
- `colorId`: Reference to Colors Collection - The reference to the color of the pixel.
- `x`: Number - The x-coordinate of the pixel.
- `y`: Number - The y-coordinate of the pixel.
- `ownerId`: Reference to Users Collection - The reference to the owner of the pixel.
- `changeHistory`: Array of objects - History of changes made to the pixel.
  - `userId`: Reference to Users Collection - The reference to the user who made the change.
  - `timestamp`: Date -
