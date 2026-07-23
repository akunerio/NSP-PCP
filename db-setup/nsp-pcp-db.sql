-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2026-04-26 10:12:40
-- 伺服器版本： 10.4.32-MariaDB
-- PHP 版本： 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `nsp-pcp-db`
--
CREATE DATABASE IF NOT EXISTS `nsp-pcp-db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nsp-pcp-db`;

-- --------------------------------------------------------

--
-- 資料表結構 `essay_info`
--

CREATE TABLE `essay_info` (
  `eid` int(11) NOT NULL,
  `topic` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `review_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `essay_state`
--

CREATE TABLE `essay_state` (
  `sid` int(11) NOT NULL,
  `eid` int(11) NOT NULL,
  `source` varchar(255) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `image`
--

CREATE TABLE `image` (
  `iid` int(11) NOT NULL,
  `eid` int(11) DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `modify_keywords` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `modify_description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `prediction`
--

CREATE TABLE `prediction` (
  `pid` int(11) NOT NULL,
  `eid` int(11) NOT NULL,
  `pname` varchar(255) DEFAULT NULL,
  `pcontent` text DEFAULT NULL,
  `option` varchar(255) DEFAULT NULL,
  `modify_pcontent` text DEFAULT NULL,
  `record_content` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `check_count` int(11) DEFAULT 0,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `prompt` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `students`
--

CREATE TABLE `students` (
  `sid` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `account` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `students`
--

INSERT INTO `students` (`sid`, `name`, `account`, `password`) VALUES
(1, 'test', 'test', 'test');

-- --------------------------------------------------------

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `essay_info`
--
ALTER TABLE `essay_info`
  ADD PRIMARY KEY (`eid`);

--
-- 資料表索引 `essay_state`
--
ALTER TABLE `essay_state`
  ADD PRIMARY KEY (`sid`,`eid`),
  ADD KEY `eid` (`eid`);

--
-- 資料表索引 `image`
--
ALTER TABLE `image`
  ADD PRIMARY KEY (`iid`),
  ADD KEY `eid` (`eid`);

--
-- 資料表索引 `prediction`
--
ALTER TABLE `prediction`
  ADD PRIMARY KEY (`pid`),
  ADD KEY `eid` (`eid`);

--
-- 資料表索引 `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`sid`),
  ADD UNIQUE KEY `account` (`account`);

--
-- 使用資料表自增值(AUTO_INCREMENT)
--

--
-- 使用資料表自增值(AUTO_INCREMENT) `essay_info`
--
ALTER TABLE `essay_info`
  MODIFY `eid` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自增值(AUTO_INCREMENT) `image`
--
ALTER TABLE `image`
  MODIFY `iid` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自增值(AUTO_INCREMENT) `prediction`
--
ALTER TABLE `prediction`
  MODIFY `pid` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自增值(AUTO_INCREMENT) `students`
--
ALTER TABLE `students`
  MODIFY `sid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 限制資料表限制式
--

--
-- 資料表限制式 `essay_state`
--
ALTER TABLE `essay_state`
  ADD CONSTRAINT `essay_state_ibfk_1` FOREIGN KEY (`sid`) REFERENCES `students` (`sid`) ON DELETE CASCADE,
  ADD CONSTRAINT `essay_state_ibfk_2` FOREIGN KEY (`eid`) REFERENCES `essay_info` (`eid`) ON DELETE CASCADE;

--
-- 資料表限制式 `image`
--
ALTER TABLE `image`
  ADD CONSTRAINT `image_ibfk_1` FOREIGN KEY (`eid`) REFERENCES `essay_info` (`eid`) ON DELETE CASCADE;

--
-- 資料表限制式 `prediction`
--
ALTER TABLE `prediction`
  ADD CONSTRAINT `prediction_ibfk_1` FOREIGN KEY (`eid`) REFERENCES `essay_info` (`eid`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
