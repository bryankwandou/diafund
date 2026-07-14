// Diafund escrow: PDA-owned pad vaults where releases are enforced by code.
// A pad is created with a verifier and a beneficiary. Donations are lamport
// transfers into the pad PDA. A milestone can only be released after the
// verifier has anchored a proof hash for it, and each milestone releases once.
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("8vzicDwCKBL8BvJy9cuaMTMN5p9fwKYwmTKuCLSmmvKj");

#[program]
pub mod diafund_escrow {
    use super::*;

    pub fn init_pad(ctx: Context<InitPad>, pad_id: String) -> Result<()> {
        require!(pad_id.len() <= 40, EscrowError::PadIdTooLong);
        let pad = &mut ctx.accounts.pad;
        pad.authority = ctx.accounts.authority.key();
        pad.verifier = ctx.accounts.verifier.key();
        pad.beneficiary = ctx.accounts.beneficiary.key();
        pad.pad_id = pad_id;
        pad.raised = 0;
        pad.released = 0;
        pad.bump = ctx.bumps.pad;
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        require!(amount > 0, EscrowError::ZeroAmount);
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                Transfer {
                    from: ctx.accounts.donor.to_account_info(),
                    to: ctx.accounts.pad.to_account_info(),
                },
            ),
            amount,
        )?;
        let pad = &mut ctx.accounts.pad;
        pad.raised = pad.raised.checked_add(amount).ok_or(EscrowError::Overflow)?;
        emit!(Donated {
            pad: pad.key(),
            donor: ctx.accounts.donor.key(),
            amount
        });
        Ok(())
    }

    // Only the pad's verifier can anchor a proof. One proof per milestone index.
    pub fn attest(ctx: Context<Attest>, milestone_idx: u8, proof_hash: [u8; 32]) -> Result<()> {
        let ms = &mut ctx.accounts.milestone;
        ms.pad = ctx.accounts.pad.key();
        ms.idx = milestone_idx;
        ms.proof_hash = proof_hash;
        ms.released = false;
        ms.bump = ctx.bumps.milestone;
        emit!(Attested {
            pad: ctx.accounts.pad.key(),
            idx: milestone_idx,
            proof_hash
        });
        Ok(())
    }

    // Release is possible only because the milestone account exists, which in turn
    // is only possible if the verifier attested. Funds can only go to the
    // beneficiary recorded at init. Each milestone releases exactly once.
    pub fn release(ctx: Context<Release>, milestone_idx: u8, amount: u64) -> Result<()> {
        let ms = &mut ctx.accounts.milestone;
        require!(!ms.released, EscrowError::AlreadyReleased);
        require!(amount > 0, EscrowError::ZeroAmount);

        let pad_info = ctx.accounts.pad.to_account_info();
        let rent = Rent::get()?.minimum_balance(pad_info.data_len());
        require!(
            pad_info.lamports() >= rent + amount,
            EscrowError::InsufficientVault
        );

        // The pad PDA is program-owned, so lamports are moved by direct debit.
        **pad_info.try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.beneficiary.try_borrow_mut_lamports()? += amount;

        ms.released = true;
        let pad = &mut ctx.accounts.pad;
        pad.released = pad.released.checked_add(amount).ok_or(EscrowError::Overflow)?;
        emit!(Released {
            pad: pad.key(),
            idx: milestone_idx,
            amount,
            proof_hash: ms.proof_hash
        });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(pad_id: String)]
pub struct InitPad<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Pad::INIT_SPACE,
        seeds = [b"pad", pad_id.as_bytes()],
        bump
    )]
    pub pad: Account<'info, Pad>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: recorded as the only wallet allowed to attest proofs
    pub verifier: UncheckedAccount<'info>,
    /// CHECK: recorded as the only wallet releases can pay out to
    pub beneficiary: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub pad: Account<'info, Pad>,
    #[account(mut)]
    pub donor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_idx: u8)]
pub struct Attest<'info> {
    #[account(has_one = verifier @ EscrowError::NotVerifier)]
    pub pad: Account<'info, Pad>,
    #[account(
        init,
        payer = verifier,
        space = 8 + Milestone::INIT_SPACE,
        seeds = [b"ms", pad.key().as_ref(), &[milestone_idx]],
        bump
    )]
    pub milestone: Account<'info, Milestone>,
    #[account(mut)]
    pub verifier: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_idx: u8)]
pub struct Release<'info> {
    #[account(mut, has_one = beneficiary @ EscrowError::WrongBeneficiary)]
    pub pad: Account<'info, Pad>,
    #[account(
        mut,
        seeds = [b"ms", pad.key().as_ref(), &[milestone_idx]],
        bump = milestone.bump
    )]
    pub milestone: Account<'info, Milestone>,
    /// CHECK: constrained to pad.beneficiary by has_one
    #[account(mut)]
    pub beneficiary: UncheckedAccount<'info>,
    pub signer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Pad {
    pub authority: Pubkey,
    pub verifier: Pubkey,
    pub beneficiary: Pubkey,
    #[max_len(40)]
    pub pad_id: String,
    pub raised: u64,
    pub released: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Milestone {
    pub pad: Pubkey,
    pub idx: u8,
    pub proof_hash: [u8; 32],
    pub released: bool,
    pub bump: u8,
}

#[event]
pub struct Donated {
    pub pad: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
}
#[event]
pub struct Attested {
    pub pad: Pubkey,
    pub idx: u8,
    pub proof_hash: [u8; 32],
}
#[event]
pub struct Released {
    pub pad: Pubkey,
    pub idx: u8,
    pub amount: u64,
    pub proof_hash: [u8; 32],
}

#[error_code]
pub enum EscrowError {
    #[msg("pad id is longer than 40 bytes")]
    PadIdTooLong,
    #[msg("amount must be above zero")]
    ZeroAmount,
    #[msg("arithmetic overflow")]
    Overflow,
    #[msg("only the pad's verifier can attest")]
    NotVerifier,
    #[msg("release must pay the beneficiary recorded on the pad")]
    WrongBeneficiary,
    #[msg("milestone was already released")]
    AlreadyReleased,
    #[msg("vault does not hold enough for this release")]
    InsufficientVault,
}
